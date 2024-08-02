import http from "node:http";
import SvgNest from './Nesting/SvgNest.js';
import express from "express";
import path from "path";
import fs from "fs";

const hostname = '127.0.0.1';
const port = 3000;

const downloadPath = path.join(process.cwd(), 'downloads');
const tmpPath = path.join(process.cwd(), 'tmp');

const svgString = "<svg width='2000' height='2000' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 2048 2048'><polygon fill='none' stroke='#010101' stroke-miterlimit='10' points='1031.068,566.961 1031.068,577.655 1043.723,577.965 1044.294,568128' /><polygon fill='none' stroke='#010101' stroke-miterlimit='10' points='582.528,372.964 624.57,373.468 631.906,347.062 620.936,326.309 609.533,329.092 592.663,309.654 560.571,335.878 ' /><polygon fill='none' stroke='#010101' stroke-miterlimit='10' points='661.185,157.016 652.101,203.035 718.574,209.716 734.568,180.887 ' /><polygon fill='none' stroke='#010101' stroke-miterlimit='10' points='1057.909,602.939 1049.363,604.521 1043.723,597.907 1046.628,589.714 1055.174,588.14 1060.814,594.753 ' /></svg>";

const server = http.createServer((req,res) => {

    let svgNest = new SvgNest(svgString);

    svgNest.start(progress, renderSvg);
    svgNest.stop();


    const svgContent = req.body;
    const filename = `svg_${Date.now()}.svg`;
    const filePath = path.join(downloadPath, filename);

    fs.mkdirSync(downloadPath, { recursive: true });
    fs.writeFile(filePath, svgContent, 'utf-8', (err) => {
        if (err) {
            console.error(err);
        }
        else {
            console.log('SVG file created');
        }
    });
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Hello World!\n');
});


server.listen(port, hostname, () =>{
    console.log(`Server running at http://${hostname}:${port}`);
});

function renderSvg(svglist, efficiency, placed, total) {
    iterations++;
    document.getElementById('info_iterations').innerHTML = iterations;

    if (!svglist || svglist.length == 0) {
        return;
    }
    var bins = document.getElementById('bins');
    bins.innerHTML = '';

    for (var i = 0; i < svglist.length; i++) {
        if (svglist.length > 2) {
            svglist[i].setAttribute('class', 'grid');
        }
        bins.appendChild(svglist[i]);
    }

    if (efficiency || efficiency === 0) {
        document.getElementById('info_efficiency').innerHTML = Math.round(efficiency * 100);
    }

    document.getElementById('info_placed').innerHTML = placed + '/' + total;
    document.getElementById('info_placement').setAttribute('style', 'display: block');
    display.setAttribute('style', 'display: none');
    download.className = 'button download animated bounce';
}


function progress(percent) {
    var transition = percent > prevpercent ? '; transition: width 0.1s' : '';
    document.getElementById('info_progress').setAttribute('style', 'width: ' + Math.round(percent * 100) + '% ' + transition);
    document.getElementById('info').setAttribute('style', 'display: block');

    let prevpercent = percent;

    var now = new Date().getTime();
    if (startTime && now) {
        var diff = now - startTime;
        // show a time estimate for long-running placements
        var estimate = (diff / percent) * (1 - percent);
        document.getElementById('info_time').innerHTML = millisecondsToStr(estimate) + ' remaining';

        if (diff > 5000 && percent < 0.3 && percent > 0.02 && estimate > 10000) {
            document.getElementById('info_time').setAttribute('style', 'display: block');
        }
    }

    if (percent > 0.95 || percent < 0.02) {
        document.getElementById('info_time').setAttribute('style', 'display: none');
    }
    if (percent < 0.02) {
        let startTime = new Date().getTime();
    }
}
