class GeneticAlgorithm {
    constructor(adam, bin, config) {

        this.config = config || { populationSize: 10, mutationRate: 10, rotations: 4 };
        this.binBounds = GeometryUtil.getPolygonBounds(bin);

        // population is an array of individuals. Each individual is an object representing the order of insertion and the angle each part is rotated
        var angles = [];
        for(var i=0; i<adam.length; i++){
            angles.push(this.randomAngle(adam[i]));
        }

        this.population = [{placement: adam, rotation: angles}];

        while(this.population.length < config.populationSize){
            var mutant = this.mutate(this.population[0]);
            this.population.push(mutant);
        }
    }

    // returns a random angle of insertion
    randomAngle(part) {

        var angleList = [];
        for(var i=0; i<Math.max(this.config.rotations,1); i++){
            angleList.push(i*(360/this.config.rotations));
        }

        function shuffleArray(array) {
            for (var i = array.length - 1; i > 0; i--) {
                var j = Math.floor(Math.random() * (i + 1));
                var temp = array[i];
                array[i] = array[j];
                array[j] = temp;
            }
            return array;
        }

        angleList = shuffleArray(angleList);

        for(i=0; i<angleList.length; i++){
            var rotatedPart = GeometryUtil.rotatePolygon(part, angleList[i]);

            // don't use obviously bad angles where the part doesn't fit in the bin
            if(rotatedPart.width < this.binBounds.width && rotatedPart.height < this.binBounds.height){
                return angleList[i];
            }
        }

        return 0;
    }

    // returns a mutated individual with the given mutation rate
    mutate(individual) {
        var clone = {placement: individual.placement.slice(0), rotation: individual.rotation.slice(0)};
        for(var i=0; i<clone.placement.length; i++){
            var rand = Math.random();
            if(rand < 0.01*this.config.mutationRate){
                // swap current part with next part
                var j = i+1;

                if(j < clone.placement.length){
                    var temp = clone.placement[i];
                    clone.placement[i] = clone.placement[j];
                    clone.placement[j] = temp;
                }
            }

            rand = Math.random();
            if(rand < 0.01*this.config.mutationRate){
                clone.rotation[i] = this.randomAngle(clone.placement[i]);
            }
        }

        return clone;
    }

    // single point crossover
    mate(male, female) {
        var cutpoint = Math.round(Math.min(Math.max(Math.random(), 0.1), 0.9)*(male.placement.length-1));

        var gene1 = male.placement.slice(0,cutpoint);
        var rot1 = male.rotation.slice(0,cutpoint);

        var gene2 = female.placement.slice(0,cutpoint);
        var rot2 = female.rotation.slice(0,cutpoint);

        var i;

        for(i=0; i<female.placement.length; i++){
            if(!contains(gene1, female.placement[i].id)){
                gene1.push(female.placement[i]);
                rot1.push(female.rotation[i]);
            }
        }

        for(i=0; i<male.placement.length; i++){
            if(!contains(gene2, male.placement[i].id)){
                gene2.push(male.placement[i]);
                rot2.push(male.rotation[i]);
            }
        }

        function contains(gene, id){
            for(var i=0; i<gene.length; i++){
                if(gene[i].id == id){
                    return true;
                }
            }
            return false;
        }

        return [{placement: gene1, rotation: rot1},{placement: gene2, rotation: rot2}];
    }

    generation() {

        // Individuals with higher fitness are more likely to be selected for mating
        this.population.sort(function(a, b){
            return a.fitness - b.fitness;
        });

        // fittest individual is preserved in the new generation (elitism)
        var newpopulation = [this.population[0]];

        while(newpopulation.length < this.population.length){
            var male = this.randomWeightedIndividual();
            var female = this.randomWeightedIndividual(male);

            // each mating produces two children
            var children = this.mate(male, female);

            // slightly mutate children
            newpopulation.push(this.mutate(children[0]));

            if(newpopulation.length < this.population.length){
                newpopulation.push(this.mutate(children[1]));
            }
        }

        this.population = newpopulation;
    }

    // returns a random individual from the population, weighted to the front of the list (lower fitness value is more likely to be selected)
    randomWeightedIndividual(exclude) {
        var pop = this.population.slice(0);

        if(exclude && pop.indexOf(exclude) >= 0){
            pop.splice(pop.indexOf(exclude),1);
        }

        var rand = Math.random();

        var lower = 0;
        var weight = 1/pop.length;
        var upper = weight;

        for(var i=0; i<pop.length; i++){
            // if the random number falls between lower and upper bounds, select this individual
            if(rand > lower && rand < upper){
                return pop[i];
            }
            lower = upper;
            upper += 2*weight * ((pop.length-i)/pop.length);
        }

        return pop[0];
    }
}
