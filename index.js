import puppeteer from 'puppeteer';
import express from 'express';
import path from 'path';
import cors from 'cors';
import fs from 'fs';

const app = express();
app.use(cors());
const port = 3000;

function sleep(ms) {
  return (new Promise((resolve) => {
    setTimeout(resolve, ms);
  }))
}

app.get("/", async (req, res) => {
  const browser = await puppeteer.launch({headless: false});
  const page = await browser.newPage();
  await page.goto('http://localhost:8000');

  const filePath = path.relative(process.cwd(), 'parts.svg');
  const input = await page.waitForSelector('#fileinput');
  await input.uploadFile(filePath);

  const binPath = path.relative(process.cwd(), 'bin.svg');
  const binInput = await page.waitForSelector('#bininput');
  await binInput.uploadFile(binPath);

  // const bin = await page.waitForSelector('#DefaultBin');
  // await bin.click();
  const startButton = await page.waitForSelector('#start');
  await startButton.click();

  // wait for at least 1 iteration, TODO improve it by passing iteration count to request, get iteration display field with puppeteer
  await sleep(2000);

  const sendButton = await page.waitForSelector('#sendresult');
  await sendButton.click();

  console.log('here')
  // await browser.close();
  res.send("Hello World!");
});

app.post("/uploadSvg", express.text(), (req, res) => {
  console.log('output: ', req.body);
  const svgContent = req.body;
  const filename = `svg_${Date.now()}.svg`;
  const dirPath = path.join(process.cwd(), 'downloads');
  const filePath = path.join(dirPath, filename);

  fs.mkdirSync(dirPath);
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