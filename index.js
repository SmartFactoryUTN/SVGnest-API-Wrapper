import puppeteer from 'puppeteer';
import express from 'express';
import path from 'path';
import cors from 'cors';
import fs from 'fs';
import multer from 'multer';

const app = express();
app.use(cors());
const port = 3000;

const downloadPath = path.join(process.cwd(), 'downloads');
const tmpPath = path.join(process.cwd(), 'tmp');

function sleep(ms) {
  return (new Promise((resolve) => {
    setTimeout(resolve, ms);
  }))
}

//TODO remove images, fonts, css, everything not needed for nesting

//TODO add to request: optional config, optional iteration count
app.post("/", multer().fields([{name: 'bin'}, {name: 'parts'}]), async (req, res) => {
  // temporary directory to write bin and parts in order to send path to uploadFile(): TODO find a cleaner way to do it
  fs.mkdirSync(tmpPath, { recursive: true });
  fs.writeFileSync(path.join(tmpPath, 'bin.svg'), req.files['bin'][0].buffer);
  fs.writeFileSync(path.join(tmpPath, 'parts.svg'), req.files['parts'][0].buffer);

  const browser = await puppeteer.launch({headless: false});
  const page = await browser.newPage();
  await page.goto('http://localhost:8000');

  const partsPath = path.join(tmpPath, 'parts.svg');
  const partsInput = await page.waitForSelector('#fileinput');
  await partsInput.uploadFile(partsPath);

  // const binPath = path.relative(process.cwd(), 'bin.svg');
  const binPath = path.join(tmpPath, 'bin.svg');
  const binInput = await page.waitForSelector('#bininput');
  await binInput.uploadFile(binPath);

  fs.rmSync(tmpPath, { recursive: true, force: true});

  const startButton = await page.waitForSelector('#start');
  await startButton.click();

  // wait for at least 1 iteration, TODO improve it by passing iteration count to request, get iteration display field with puppeteer
  await sleep(2000);

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

app.listen(port, () => {
  console.log(`Nesting server listening on port ${port}!`);
});