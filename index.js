import puppeteer from 'puppeteer';
import express from 'express';
import path from 'path';
import cors from 'cors';
import fs from 'fs';

const app = express();
app.use(cors());
const port = 3000;

const downloadPath = path.join(process.cwd(), 'downloads');
const tmpPath = path.join(process.cwd(), 'tmp');

import { dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));

const defaultIterationCount = 10;

// observe for changes in selector, resolve if value reach targetValue, reject if timeout
async function waitForValueChange(page, selector1, targetValue1, selector2, targetValue2, timeout) {
    return await page.evaluate((selector1, targetValue1, selector2, targetValue2, timeout) => {
        return new Promise((resolve, reject) => {
            // Select both elements
            const iterations = document.querySelector(selector1);
            const efficiency = document.querySelector(selector2);

            // Function to check values and resolve the promise if conditions are met
            const checkValues = () => {
                const currentIterationCount = iterations.textContent;
                const currentEfficiency = efficiency.textContent;

                console.log(`Current values are '${currentIterationCount}' for '${iterations.id}' and '${currentEfficiency}' for '${efficiency.id}'`);

                if (currentIterationCount === targetValue1) {
                    console.log(`Value '${currentIterationCount}' for '${iterations.id}' matches target '${targetValue1}'`);
                    observer1.disconnect();
                    observer2.disconnect();
                    resolve();
                }else if (currentEfficiency >= targetValue2){
                    console.log(`Value '${currentEfficiency}' for '${efficiency.id}' reached target '${targetValue2}'`);
                    observer1.disconnect();
                    observer2.disconnect();
                    resolve();
                }
            };

            // Create observers for both elements
            const observer1 = new MutationObserver(checkValues);
            const observer2 = new MutationObserver(checkValues);

            // Start observing both elements
            observer1.observe(iterations, { childList: true, subtree: true, characterData: true });
            observer2.observe(efficiency, { childList: true, subtree: true, characterData: true });

            // Set a timeout to reject the promise if the condition is not met within the timeout period
            if (timeout) {
                setTimeout(() => {
                    console.log(`Timeout after ${timeout}ms waiting for value changes in '${iterations}' or '${efficiency}'`);
                    observer1.disconnect();
                    observer2.disconnect();
                    reject(new Error(`Timeout waiting for value changes in ${selector1} or ${selector2}`));
                }, timeout);
            }
        });
    }, selector1, targetValue1, selector2, targetValue2, timeout);
}
//TODO remove images, fonts, css, everything not needed for nesting

//TODO add to request: optional config
app.post("/", express.json(), async (req, res) => {
    const svgBin = req.body.svgBin;
    const svgParts = req.body.svgParts;
    const iterationCount = req.body.iterationCount;

    // temporary directory to write bin and parts in order to send path to uploadFile(): TODO find a cleaner way to do it
    fs.mkdirSync(tmpPath, { recursive: true });
    fs.writeFileSync(path.join(tmpPath, 'bin.svg'), svgBin, 'utf-8');
    fs.writeFileSync(path.join(tmpPath, 'parts.svg'), svgParts, 'utf-8');

    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    // await page.goto('file:///Users/gaston.vidal/PhpstormProjects/UTN/nesting-2d/SVGnest-API-Wrapper/index.html', { timeout: 0});
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    await page.goto('http://localhost:3000/', { timeout: 0});

    const partsPath = path.join(tmpPath, 'parts.svg');
    const partsInput = await page.waitForSelector('#fileinput');
    await partsInput.uploadFile(partsPath);

    const binPath = path.join(tmpPath, 'bin.svg');
    const binInput = await page.waitForSelector('#bininput');
    await binInput.uploadFile(binPath);

    fs.rmSync(tmpPath, { recursive: true, force: true });

    const startButton = await page.waitForSelector('#start');
    await startButton.click();

    await waitForValueChange(page, '#info_iterations', iterationCount || defaultIterationCount, '#info_efficiency', 90, 0);

    const sendButton = await page.waitForSelector('#sendresult');
    await sendButton.click();
    await browser.close();
    res.send("Nesting finshed!");
});

app.post("/uploadSvg", express.text(), (req, res) => {
    console.log('output: ', req.body);
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
    })
})

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '')));

// Define route to serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '', 'index.html'));
});

app.listen(port, () => {
    console.log(`Nesting server listening on port ${port}!`);
});
