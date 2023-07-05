import puppeteer from 'puppeteer';
import express from 'express';
import fsPromise from 'fs/promises';
import path from 'path';

// const express = require("express");
// const fsPromise = require("fs/promises");

const app = express();
const port = 3000;

function sleep(ms) {
  return (new Promise((resolve) => {
    setTimeout(resolve, ms);
  }))
}

async function getSvgStringFromFile(path) {
  let svgString = await fsPromise.readFile(path, 'utf8');

  svgString = svgString.replaceAll('\n', ' ');
  return (svgString);
}

app.get("/", async (req, res) => {
  // const partsSvg = await getSvgStringFromFile('./parts.svg');
  // const binSvg = await getSvgStringFromFile('./bin.svg');

  const browser = await puppeteer.launch({headless: false});
  const page = await browser.newPage();
  // await page.goto('file:///home/flo/Work/nesting_pttr_node_server/index.html');
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
  // const downloadButton = await page.waitForSelector('#download');
  // await downloadButton.click();

  // await browser.close();
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Nesting server listening on port ${port}!`);
});