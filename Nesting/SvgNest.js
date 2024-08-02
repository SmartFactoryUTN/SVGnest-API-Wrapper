import SvgParser from "./SvgParser.js";

export default class SvgNest {

    constructor(svgString) {
        let self = this;

        let svg = null;

        // keep a reference to any style nodes, to maintain color/fill info
        this.style = null;

        let parts = null;

        let tree = null;


        let bin = null;
        let binPolygon = null;
        let binBounds = null;
        let nfpCache = {};
        const config = {
            clipperScale: 10000000,
            curveTolerance: 0.3,
            spacing: 0,
            rotations: 4,
            populationSize: 10,
            mutationRate: 10,
            useHoles: false,
            exploreConcave: false
        };

        this.working = false;

        let GA = null;
        let best = null;
        let workerTimer = null;
        let progress = 0;

        let svgParser = null;

        this.parseSvg(svgString);
    }

    parseSvg(svgstring) {
        // reset if in progress
        this.stop();

        this.bin = null;
        this.binPolygon = null;
        this.tree = null;

        this.svgParser = new SvgParser();

        // parse svg
        this.svg = this.svgParser.load(svgstring);

        this.style = this.svgParser.getStyle();

        this.svg = this.svgParser.cleanInput();

        this.tree = this.getParts(this.svg.childNodes);

        //re-order elements such that deeper elements are on top, so they can be moused over
        function zorder(paths) {
            // depth-first
            var length = paths.length;
            for (var i = 0; i < length; i++) {
                if (paths[i].children && paths[i].children.length > 0) {
                    zorder(paths[i].children);
                }
            }
        }

        return this.svg;
    }

    setbin = function (element) {
        if (!svg) {
            return;
        }
        this.bin = element;
    }

    config(c) {
        // clean up inputs

        if (!c) {
            return this.config;
        }

        if (c.curveTolerance && !GeometryUtil.almostEqual(parseFloat(c.curveTolerance), 0)) {
            this.config.curveTolerance = parseFloat(c.curveTolerance);
        }

        if ('spacing' in c) {
            config.spacing = parseFloat(c.spacing);
        }

        if (c.rotations && parseInt(c.rotations) > 0) {
            config.rotations = parseInt(c.rotations);
        }

        if (c.populationSize && parseInt(c.populationSize) > 2) {
            config.populationSize = parseInt(c.populationSize);
        }

        if (c.mutationRate && parseInt(c.mutationRate) > 0) {
            config.mutationRate = parseInt(c.mutationRate);
        }

        if ('useHoles' in c) {
            config.useHoles = !!c.useHoles;
        }

        if ('exploreConcave' in c) {
            config.exploreConcave = !!c.exploreConcave;
        }

        this.svgParser.config({tolerance: config.curveTolerance});

        this.best = null;
        this.nfpCache = {};
        this.binPolygon = null;
        this.GA = null;

        return config;
    }

    // progressCallback is called when progress is made
    // displayCallback is called when a new placement has been made
    start(progressCallback, displayCallback) {
        if (!this.svg || !this.bin) {
            return false;
        }

        this.parts = Array.prototype.slice.call(svg.childNodes);
        let binindex = this.parts.indexOf(this.bin);

        if (binindex >= 0) {
            // don't process bin as a part of the tree
            this.parts.parts.splice(binindex, 1);
        }

        // build tree without bin
        this.tree = this.getParts(this.parts.slice(0));

        offsetTree(tree, 0.5 * config.spacing, this.polygonOffset.bind(this));

        // offset tree recursively
        function offsetTree(t, offset, offsetFunction) {
            for (var i = 0; i < t.length; i++) {
                var offsetpaths = offsetFunction(t[i], offset);
                if (offsetpaths.length == 1) {
                    // replace array items in place
                    Array.prototype.splice.apply(t[i], [0, t[i].length].concat(offsetpaths[0]));
                }

                if (t[i].childNodes && t[i].childNodes.length > 0) {
                    offsetTree(t[i].childNodes, -offset, offsetFunction);
                }
            }
        }

        this.binPolygon = this.svgParser.polygonify(bin);
        this.binPolygon = this.cleanPolygon(binPolygon);

        if (!this.binPolygon || this.binPolygon.length < 3) {
            return false;
        }

        this.binBounds = GeometryUtil.getPolygonBounds(binPolygon);

        if (config.spacing > 0) {
            var offsetBin = this.polygonOffset(binPolygon, -0.5 * config.spacing);
            if (offsetBin.length == 1) {
                // if the offset contains 0 or more than 1 path, something went wrong.
                this.binPolygon = offsetBin.pop();
            }
        }

        this.binPolygon.id = -1;

        // put bin on origin
        let xbinmax = this.binPolygon[0].x;
        let xbinmin = this.binPolygon[0].x;
        let ybinmax = this.binPolygon[0].y;
        let ybinmin = this.binPolygon[0].y;

        for (var i = 1; i < this.binPolygon.length; i++) {
            if (binPolygon[i].x > xbinmax) {
                xbinmax = binPolygon[i].x;
            } else if (binPolygon[i].x < xbinmin) {
                xbinmin = binPolygon[i].x;
            }
            if (binPolygon[i].y > ybinmax) {
                ybinmax = binPolygon[i].y;
            } else if (binPolygon[i].y < ybinmin) {
                ybinmin = binPolygon[i].y;
            }
        }

        for (i = 0; i < this.binPolygon.length; i++) {
            binPolygon[i].x -= xbinmin;
            binPolygon[i].y -= ybinmin;
        }

        this.binPolygon.width = xbinmax - xbinmin;
        this.binPolygon.height = ybinmax - ybinmin;

        // all paths need to have the same winding direction
        if (GeometryUtil.polygonArea(this.binPolygon) > 0) {
            binPolygon.reverse();
        }

        // remove duplicate endpoints, ensure counterclockwise winding direction
        for (i = 0; i < this.tree.length; i++) {
            let start = this.tree[i][0];
            let end = this.tree[i][this.tree[i].length - 1];
            if (start === end || (GeometryUtil.almostEqual(start.x, end.x) && GeometryUtil.almostEqual(start.y, end.y))) {
                this.tree[i].pop();
            }

            if (GeometryUtil.polygonArea(this.tree[i]) > 0) {
                this.tree[i].reverse();
            }
        }

        let self = this;
        this.working = false;

        this.workerTimer = setInterval(function () {
            if (!self.working) {
                self.launchWorkers.call(self, this.tree, this.binPolygon, config, progressCallback, displayCallback);
                self.working = true;
            }

            progressCallback(progress);
        }, 100);
    }

    launchWorkers(tree, binPolygon, config, progressCallback, displayCallback) {
        let i, j;

        if (this.GA === null) {
            // initiate new GA
            let adam = tree.slice(0);

            // seed with decreasing area
            adam.sort(function (a, b) {
                return Math.abs(GeometryUtil.polygonArea(b)) - Math.abs(GeometryUtil.polygonArea(a));
            });

            this.GA = new GeneticAlgorithm(adam, binPolygon, config);
        }

        var individual = null;

        // evaluate all members of the population
        for (i = 0; i < GA.population.length; i++) {
            if (!GA.population[i].fitness) {
                individual = GA.population[i];
                break;
            }
        }

        if (individual === null) {
            // all individuals have been evaluated, start next generation
            GA.generation();
            individual = GA.population[1];
        }

        var placelist = individual.placement;
        var rotations = individual.rotation;

        var ids = [];
        for (i = 0; i < placelist.length; i++) {
            ids.push(placelist[i].id);
            placelist[i].rotation = rotations[i];
        }

        var nfpPairs = [];
        var key;
        var newCache = {};

        for (i = 0; i < placelist.length; i++) {
            var part = placelist[i];
            key = {A: binPolygon.id, B: part.id, inside: true, Arotation: 0, Brotation: rotations[i]};
            if (!nfpCache[JSON.stringify(key)]) {
                nfpPairs.push({A: binPolygon, B: part, key: key});
            } else {
                newCache[JSON.stringify(key)] = nfpCache[JSON.stringify(key)]
            }
            for (j = 0; j < i; j++) {
                var placed = placelist[j];
                key = {A: placed.id, B: part.id, inside: false, Arotation: rotations[j], Brotation: rotations[i]};
                if (!nfpCache[JSON.stringify(key)]) {
                    nfpPairs.push({A: placed, B: part, key: key});
                } else {
                    newCache[JSON.stringify(key)] = nfpCache[JSON.stringify(key)]
                }
            }
        }

        // only keep cache for one cycle
        this.nfpCache = newCache;

        var worker = new PlacementWorker(binPolygon, placelist.slice(0), ids, rotations, config, nfpCache);

        var p = new Parallel(nfpPairs, {
            env: {
                binPolygon: binPolygon,
                searchEdges: config.exploreConcave,
                useHoles: config.useHoles
            },
            evalPath: 'util/eval.js'
        });

        p.require('matrix.js');
        p.require('geometryutil.js');
        p.require('placementworker.js');
        p.require('clipper.js');

        var self = this;
        var spawncount = 0;
        p._spawnMapWorker = function (i, cb, done, env, wrk) {
            // hijack the worker call to check progress
            progress = spawncount++ / nfpPairs.length;
            return Parallel.prototype._spawnMapWorker.call(p, i, cb, done, env, wrk);
        }

        p.map(function (pair) {
            let i;
            if (!pair || pair.length == 0) {
                return null;
            }
            var searchEdges = global.env.searchEdges;
            var useHoles = global.env.useHoles;

            var A = rotatePolygon(pair.A, pair.key.Arotation);
            var B = rotatePolygon(pair.B, pair.key.Brotation);

            var nfp;

            if (pair.key.inside) {
                if (GeometryUtil.isRectangle(A, 0.001)) {
                    nfp = GeometryUtil.noFitPolygonRectangle(A, B);
                } else {
                    nfp = GeometryUtil.noFitPolygon(A, B, true, searchEdges);
                }

                // ensure all interior NFPs have the same winding direction
                if (nfp && nfp.length > 0) {
                    for (i = 0; i < nfp.length; i++) {
                        if (GeometryUtil.polygonArea(nfp[i]) > 0) {
                            nfp[i].reverse();
                        }
                    }
                } else {
                    // warning on null inner NFP
                    // this is not an error, as the part may simply be larger than the bin or otherwise unplaceable due to geometry
                    log('NFP Warning: ', pair.key);
                }
            } else {
                if (searchEdges) {
                    nfp = GeometryUtil.noFitPolygon(A, B, false, searchEdges);
                } else {
                    nfp = minkowskiDifference(A, B);
                }
                // sanity check
                if (!nfp || nfp.length == 0) {
                    log('NFP Error: ', pair.key);
                    log('A: ', JSON.stringify(A));
                    log('B: ', JSON.stringify(B));
                    return null;
                }

                for (i = 0; i < nfp.length; i++) {
                    if (!searchEdges || i == 0) { // if searchedges is active, only the first NFP is guaranteed to pass sanity check
                        if (Math.abs(GeometryUtil.polygonArea(nfp[i])) < Math.abs(GeometryUtil.polygonArea(A))) {
                            log('NFP Area Error: ', Math.abs(GeometryUtil.polygonArea(nfp[i])), pair.key);
                            log('NFP:', JSON.stringify(nfp[i]));
                            log('A: ', JSON.stringify(A));
                            log('B: ', JSON.stringify(B));
                            nfp.splice(i, 1);
                            return null;
                        }
                    }
                }

                if (nfp.length == 0) {
                    return null;
                }

                // for outer NFPs, the first is guaranteed to be the largest. Any subsequent NFPs that lie inside the first are holes
                for (i = 0; i < nfp.length; i++) {
                    if (GeometryUtil.polygonArea(nfp[i]) > 0) {
                        nfp[i].reverse();
                    }

                    if (i > 0) {
                        if (GeometryUtil.pointInPolygon(nfp[i][0], nfp[0])) {
                            if (GeometryUtil.polygonArea(nfp[i]) < 0) {
                                nfp[i].reverse();
                            }
                        }
                    }
                }

                // generate nfps for children (holes of parts) if any exist
                if (useHoles && A.childNodes && A.childNodes.length > 0) {
                    var Bbounds = GeometryUtil.getPolygonBounds(B);

                    for (i = 0; i < A.childNodes.length; i++) {
                        var Abounds = GeometryUtil.getPolygonBounds(A.childNodes[i]);

                        // no need to find nfp if B's bounding box is too big
                        if (Abounds.width > Bbounds.width && Abounds.height > Bbounds.height) {

                            var cnfp = GeometryUtil.noFitPolygon(A.childNodes[i], B, true, searchEdges);
                            // ensure all interior NFPs have the same winding direction
                            if (cnfp && cnfp.length > 0) {
                                for (var j = 0; j < cnfp.length; j++) {
                                    if (GeometryUtil.polygonArea(cnfp[j]) < 0) {
                                        cnfp[j].reverse();
                                    }
                                    nfp.push(cnfp[j]);
                                }
                            }
                        }
                    }
                }
            }

            function log() {
                if (typeof console !== "undefined") {
                    console.log.apply(console, arguments);
                }
            }

            function toClipperCoordinates(polygon) {
                var clone = [];
                for (var i = 0; i < polygon.length; i++) {
                    clone.push({
                        X: polygon[i].x,
                        Y: polygon[i].y
                    });
                }

                return clone;
            }

            function toNestCoordinates(polygon, scale) {
                var clone = [];
                for (var i = 0; i < polygon.length; i++) {
                    clone.push({
                        x: polygon[i].X / scale,
                        y: polygon[i].Y / scale
                    });
                }

                return clone;
            }

            function minkowskiDifference(A, B) {
                var Ac = toClipperCoordinates(A);
                ClipperLib.JS.ScaleUpPath(Ac, 10000000);
                var Bc = toClipperCoordinates(B);
                ClipperLib.JS.ScaleUpPath(Bc, 10000000);
                for (var i = 0; i < Bc.length; i++) {
                    Bc[i].X *= -1;
                    Bc[i].Y *= -1;
                }
                var solution = ClipperLib.Clipper.MinkowskiSum(Ac, Bc, true);
                var clipperNfp;

                var largestArea = null;
                for (i = 0; i < solution.length; i++) {
                    var n = toNestCoordinates(solution[i], 10000000);
                    var sarea = GeometryUtil.polygonArea(n);
                    if (largestArea === null || largestArea > sarea) {
                        clipperNfp = n;
                        largestArea = sarea;
                    }
                }

                for (var i = 0; i < clipperNfp.length; i++) {
                    clipperNfp[i].x += B[0].x;
                    clipperNfp[i].y += B[0].y;
                }

                return [clipperNfp];
            }

            return {key: pair.key, value: nfp};
        }).then(function (generatedNfp) {
            if (generatedNfp) {
                for (var i = 0; i < generatedNfp.length; i++) {
                    var Nfp = generatedNfp[i];

                    if (Nfp) {
                        // a null nfp means the nfp could not be generated, either because the parts simply don't fit or an error in the nfp algo
                        var key = JSON.stringify(Nfp.key);
                        nfpCache[key] = Nfp.value;
                    }
                }
            }
            worker.nfpCache = nfpCache;

            // can't use .spawn because our data is an array
            var p2 = new Parallel([placelist.slice(0)], {
                env: {
                    self: worker
                },
                evalPath: 'util/eval.js'
            });

            p2.require('json.js');
            p2.require('clipper.js');
            p2.require('matrix.js');
            p2.require('geometryutil.js');
            p2.require('placementworker.js');

            p2.map(worker.placePaths).then(function (placements) {
                if (!placements || placements.length == 0) {
                    return;
                }

                individual.fitness = placements[0].fitness;
                var bestresult = placements[0];

                for (var i = 1; i < placements.length; i++) {
                    if (placements[i].fitness < bestresult.fitness) {
                        bestresult = placements[i];
                    }
                }

                if (!best || bestresult.fitness < best.fitness) {
                    this.best = bestresult;

                    var placedArea = 0;
                    var totalArea = 0;
                    var numParts = placelist.length;
                    var numPlacedParts = 0;

                    for (i = 0; i < best.placements.length; i++) {
                        totalArea += Math.abs(GeometryUtil.polygonArea(binPolygon));
                        for (var j = 0; j < best.placements[i].length; j++) {
                            placedArea += Math.abs(GeometryUtil.polygonArea(tree[best.placements[i][j].id]));
                            numPlacedParts++;
                        }
                    }

                    displayCallback(self.applyPlacement(best.placements), placedArea / totalArea, numPlacedParts, numParts);
                } else {
                    displayCallback();
                }
                self.working = false;
            }, function (err) {
                console.log(err);
            });
        }, function (err) {
            console.log(err);
        });
    }

    // assuming no intersections, return a tree where odd leaves are parts and even ones are holes
    // might be easier to use the DOM, but paths can't have paths as children. So we'll just make our own tree.
    getParts(paths) {

        var i, j;
        var polygons = [];

        var numChildren = paths.length;

        for (i = 0; i < numChildren; i++) {
            var poly = this.svgParser.polygonify(paths[i]);
            poly = this.cleanPolygon(poly);

            // todo: warn user if poly could not be processed and is excluded from the nest
            if (poly && poly.length > 2 && Math.abs(GeometryUtil.polygonArea(poly)) > config.curveTolerance * config.curveTolerance) {
                poly.source = i;
                polygons.push(poly);
            }
        }

        // turn the list into a tree
        toTree(polygons);

        function toTree(list, idstart) {
            var parents = [];
            var i, j;

            // assign a unique id to each leaf
            var id = idstart || 0;

            for (i = 0; i < list.length; i++) {
                var p = list[i];

                var ischild = false;
                for (j = 0; j < list.length; j++) {
                    if (j == i) {
                        continue;
                    }
                    if (GeometryUtil.pointInPolygon(p[0], list[j]) === true) {
                        if (!list[j].children) {
                            list[j].children = [];
                        }
                        list[j].children.push(p);
                        p.parent = list[j];
                        ischild = true;
                        break;
                    }
                }

                if (!ischild) {
                    parents.push(p);
                }
            }

            for (i = 0; i < list.length; i++) {
                if (parents.indexOf(list[i]) < 0) {
                    list.splice(i, 1);
                    i--;
                }
            }

            for (i = 0; i < parents.length; i++) {
                parents[i].id = id;
                id++;
            }

            for (i = 0; i < parents.length; i++) {
                if (parents[i].children) {
                    id = toTree(parents[i].children, id);
                }
            }

            return id;
        }

        return polygons;
    };

    // use the clipper library to return an offset to the given polygon. Positive offset expands the polygon, negative contracts
    // note that this returns an array of polygons
    polygonOffset(polygon, offset) {
        if (!offset || offset == 0 || GeometryUtil.almostEqual(offset, 0)) {
            return polygon;
        }

        var p = this.svgToClipper(polygon);

        var miterLimit = 2;
        var co = new ClipperLib.ClipperOffset(miterLimit, config.curveTolerance * config.clipperScale);
        co.AddPath(p, ClipperLib.JoinType.jtRound, ClipperLib.EndType.etClosedPolygon);

        var newpaths = new ClipperLib.Paths();
        co.Execute(newpaths, offset * config.clipperScale);

        var result = [];
        for (var i = 0; i < newpaths.length; i++) {
            result.push(this.clipperToSvg(newpaths[i]));
        }

        return result;
    };

    // returns a less complex polygon that satisfies the curve tolerance
    cleanPolygon(polygon) {
        var p = this.svgToClipper(polygon);
        // remove self-intersections and find the biggest polygon that's left
        var simple = ClipperLib.Clipper.SimplifyPolygon(p, ClipperLib.PolyFillType.pftNonZero);

        if (!simple || simple.length == 0) {
            return null;
        }

        var biggest = simple[0];
        var biggestarea = Math.abs(ClipperLib.Clipper.Area(biggest));
        for (var i = 1; i < simple.length; i++) {
            var area = Math.abs(ClipperLib.Clipper.Area(simple[i]));
            if (area > biggestarea) {
                biggest = simple[i];
                biggestarea = area;
            }
        }

        // clean up singularities, coincident points and edges
        var clean = ClipperLib.Clipper.CleanPolygon(biggest, config.curveTolerance * config.clipperScale);

        if (!clean || clean.length == 0) {
            return null;
        }

        return this.clipperToSvg(clean);
    }

    // converts a polygon from normal float coordinates to integer coordinates used by clipper, as well as x/y -> X/Y
    svgToClipper(polygon) {
        var clip = [];
        for (var i = 0; i < polygon.length; i++) {
            clip.push({X: polygon[i].x, Y: polygon[i].y});
        }

        ClipperLib.JS.ScaleUpPath(clip, config.clipperScale);

        return clip;
    }

    clipperToSvg(polygon) {
        var normal = [];

        for (var i = 0; i < polygon.length; i++) {
            normal.push({x: polygon[i].X / config.clipperScale, y: polygon[i].Y / config.clipperScale});
        }

        return normal;
    }

    // returns an array of SVG elements that represent the placement, for export or rendering
    applyPlacement(placement) {
        var i, j, k;
        var clone = [];
        for (i = 0; i < parts.length; i++) {
            clone.push(parts[i].cloneNode(false));
        }

        var svglist = [];

        for (i = 0; i < placement.length; i++) {
            var newsvg = svg.cloneNode(false);
            newsvg.setAttribute('viewBox', '0 0 ' + binBounds.width + ' ' + binBounds.height);
            newsvg.setAttribute('width', binBounds.width + 'px');
            newsvg.setAttribute('height', binBounds.height + 'px');
            var binclone = bin.cloneNode(false);

            binclone.setAttribute('class', 'bin');
            binclone.setAttribute('transform', 'translate(' + (-binBounds.x) + ' ' + (-binBounds.y) + ')');
            newsvg.appendChild(binclone);

            for (j = 0; j < placement[i].length; j++) {
                var p = placement[i][j];
                var part = tree[p.id];

                // the original path could have transforms and stuff on it, so apply our transforms on a group
                var partgroup = document.createElementNS(svg.namespaceURI, 'g');
                partgroup.setAttribute('transform', 'translate(' + p.x + ' ' + p.y + ') rotate(' + p.rotation + ')');
                partgroup.appendChild(clone[part.source]);

                if (part.children && part.children.length > 0) {
                    var flattened = _flattenTree(part.children, true);
                    for (k = 0; k < flattened.length; k++) {

                        var c = clone[flattened[k].source];
                        // add class to indicate hole
                        if (flattened[k].hole && (!c.getAttribute('class') || c.getAttribute('class').indexOf('hole') < 0)) {
                            c.setAttribute('class', c.getAttribute('class') + ' hole');
                        }
                        partgroup.appendChild(c);
                    }
                }

                newsvg.appendChild(partgroup);
            }

            svglist.push(newsvg);
        }

        // flatten the given tree into a list
        function _flattenTree(t, hole) {
            var flat = [];
            for (var i = 0; i < t.length; i++) {
                flat.push(t[i]);
                t[i].hole = hole;
                if (t[i].children && t[i].children.length > 0) {
                    flat = flat.concat(_flattenTree(t[i].children, !hole));
                }
            }

            return flat;
        }

        return svglist;
    }

    stop() {
        this.working = false;
        if (this.workerTimer) {
            clearInterval(this.workerTimer);
        }
    };
}
