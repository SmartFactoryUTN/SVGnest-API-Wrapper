import puppeteer from 'puppeteer';
import * as path from 'path';
import fs from 'fs';
import os from 'os';
import process from 'node:process';
import chalk from 'chalk';

const tmpPath = path.join(process.cwd(), 'tmp');

// observe for changes in selector, resolve if value reach targetValue, reject if timeout
async function waitForValueChange(page, selector, targetValue, timeout) {
    return (await page.evaluate((selector, targetValue, timeout) => {
        return (new Promise((resolve, reject) => {
            const element = document.querySelector(selector);

            const observer = new MutationObserver(() => {
                const currentValue = element.textContent;
                if (currentValue == targetValue) {
                    console.log('value ok!')
                    observer.disconnect();
                    resolve();
                }
            });
            observer.observe(element, { childList: true });
            if (timeout) {
                setTimeout(() => {
                    observer.disconnect();
                    reject(new Error(`Timeout waiting for value change in ${selector}`));
                }, timeout)
            }
        }))
    }, selector, targetValue, timeout))
}

function printStatistics() {
    console.timeEnd('Execution Time');

    const finalCpuUsage = process.cpuUsage(initialCpuUsage);
    const finalMemoryUsage = process.memoryUsage();
    const endTime = performance.now();
    const threadInfo = os.cpus();
    const executionTime = endTime - startTime;

    const totalMemoryConsumed = {
        rss: (finalMemoryUsage.rss - initialMemoryUsage.rss) / 1024 / 1024,
        heapTotal: (finalMemoryUsage.heapTotal - initialMemoryUsage.heapTotal) / 1024 / 1024,
        heapUsed: (finalMemoryUsage.heapUsed - initialMemoryUsage.heapUsed) / 1024 / 1024,
        external: (finalMemoryUsage.external - initialMemoryUsage.external) / 1024 / 1024
    };

    const totalMemorySum = Object.values(totalMemoryConsumed).reduce((acc, val) => acc + val, 0);


    console.log(chalk.blue('\nExecution Time:'));
    console.log(chalk.green(`Total Execution Time: ${executionTime.toFixed(2)} ms\n`));

    console.log('Threads:');
    console.log(`Number of CPU cores: ${threadInfo.length}`);
    threadInfo.forEach((cpu, index) => {
        console.log(`CPU ${index}: ${JSON.stringify(cpu.times)}`);
    });

    console.log(chalk.blue('Initial Memory Usage:'));
    console.log(chalk.green(`RSS: ${(initialMemoryUsage.rss / 1024 / 1024).toFixed(2)} MB`));
    console.log(chalk.green(`Heap Total: ${(initialMemoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`));
    console.log(chalk.green(`Heap Used: ${(initialMemoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`));
    console.log(chalk.green(`External: ${(initialMemoryUsage.external / 1024 / 1024).toFixed(2)} MB\n`));

    console.log(chalk.blue('Final Memory Usage:'));
    console.log(chalk.green(`RSS: ${(finalMemoryUsage.rss / 1024 / 1024).toFixed(2)} MB`));
    console.log(chalk.green(`Heap Total: ${(finalMemoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`));
    console.log(chalk.green(`Heap Used: ${(finalMemoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`));
    console.log(chalk.green(`External: ${(finalMemoryUsage.external / 1024 / 1024).toFixed(2)} MB\n`));

    console.log(chalk.blue('Total Memory Consumed:'));
    console.log(chalk.red(`RSS: ${totalMemoryConsumed.rss.toFixed(2)} MB`));
    console.log(chalk.red(`Heap Total: ${totalMemoryConsumed.heapTotal.toFixed(2)} MB`));
    console.log(chalk.red(`Heap Used: ${totalMemoryConsumed.heapUsed.toFixed(2)} MB`));
    console.log(chalk.red(`External: ${totalMemoryConsumed.external.toFixed(2)} MB\n`));
    console.log(chalk.red(`Sum of Total Memory Consumed: ${totalMemorySum.toFixed(2)} MB\n`));

    console.log(chalk.blue('Initial CPU Usage:'));
    console.log(chalk.green(`User CPU time: ${(initialCpuUsage.user / 1000).toFixed(2)} ms`));
    console.log(chalk.green(`System CPU time: ${(initialCpuUsage.system / 1000).toFixed(2)} ms\n`));

    console.log(chalk.blue('Final CPU Usage:'));
    console.log(chalk.green(`User CPU time: ${(finalCpuUsage.user / 1000).toFixed(2)} ms`));
    console.log(chalk.green(`System CPU time: ${(finalCpuUsage.system / 1000).toFixed(2)} ms\n`));
}

console.time('Execution Time');
const initialCpuUsage = process.cpuUsage();
const initialMemoryUsage = process.memoryUsage();


const startTime = performance.now();
const jsonString = `{
    "svgBin": "<svg width='2000' height='2000' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 2048 2048'><rect width='511.822' height='339.235' fill='grey' stroke='#010101'/></svg>",
    "svgParts": "<svg width='2000' height='2000' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 2048 2048'><polygon fill='green' stroke='#010101' stroke-miterlimit='10' points='582.528,372.964 624.57,373.468 631.906,347.062 620.936,326.309 609.533,329.092 592.663,309.654 560.571,335.878 '/><polygon fill='green' stroke='#010101' stroke-miterlimit='10' points='582.528,372.964 624.57,373.468 631.906,347.062 620.936,326.309 609.533,329.092 592.663,309.654 560.571,335.878 '/><polygon fill='green' stroke='#010101' stroke-miterlimit='10' points='582.528,372.964 624.57,373.468 631.906,347.062 620.936,326.309 609.533,329.092 592.663,309.654 560.571,335.878 '/><polygon fill='green' stroke='#010101' stroke-miterlimit='10' points='582.528,372.964 624.57,373.468 631.906,347.062 620.936,326.309 609.533,329.092 592.663,309.654 560.571,335.878 '/><polygon fill='green' stroke='#010101' stroke-miterlimit='10' points='582.528,372.964 624.57,373.468 631.906,347.062 620.936,326.309 609.533,329.092 592.663,309.654 560.571,335.878 '/><polygon fill='green' stroke='#010101' stroke-miterlimit='10' points='582.528,372.964 624.57,373.468 631.906,347.062 620.936,326.309 609.533,329.092 592.663,309.654 560.571,335.878 '/><polygon fill='green' stroke='#010101' stroke-miterlimit='10' points='582.528,372.964 624.57,373.468 631.906,347.062 620.936,326.309 609.533,329.092 592.663,309.654 560.571,335.878 '/><polygon fill='green' stroke='#010101' stroke-miterlimit='10' points='582.528,372.964 624.57,373.468 631.906,347.062 620.936,326.309 609.533,329.092 592.663,309.654 560.571,335.878 '/><polygon fill='green' stroke='#010101' stroke-miterlimit='10' points='582.528,372.964 624.57,373.468 631.906,347.062 620.936,326.309 609.533,329.092 592.663,309.654 560.571,335.878 '/><polygon fill='green' stroke='#010101' stroke-miterlimit='10' points='582.528,372.964 624.57,373.468 631.906,347.062 620.936,326.309 609.533,329.092 592.663,309.654 560.571,335.878 '/><polygon fill='green' stroke='#010101' stroke-miterlimit='10' points='582.528,372.964 624.57,373.468 631.906,347.062 620.936,326.309 609.533,329.092 592.663,309.654 560.571,335.878 '/><polygon fill='green' stroke='#010101' stroke-miterlimit='10' points='582.528,372.964 624.57,373.468 631.906,347.062 620.936,326.309 609.533,329.092 592.663,309.654 560.571,335.878 '/><polygon fill='green' stroke='#010101' stroke-miterlimit='10' points='661.185,157.016 652.101,203.035 718.574,209.716 734.568,180.887 '/><polygon fill='green' stroke='#010101' stroke-miterlimit='10' points='661.185,157.016 652.101,203.035 718.574,209.716 734.568,180.887 '/><polygon fill='green' stroke='#010101' stroke-miterlimit='10' points='661.185,157.016 652.101,203.035 718.574,209.716 734.568,180.887 '/><polygon fill='green' stroke='#010101' stroke-miterlimit='10' points='1057.909,602.939 1049.363,604.521 1043.723,597.907 1046.628,589.714 1055.174,588.14 1060.814,594.753'/><polygon fill='green' stroke='#010101' stroke-miterlimit='10' points='1057.909,602.939 1049.363,604.521 1043.723,597.907 1046.628,589.714 1055.174,588.14 1060.814,594.753'/><polygon fill='green' stroke='#010101' stroke-miterlimit='10' points='1057.909,602.939 1049.363,604.521 1043.723,597.907 1046.628,589.714 1055.174,588.14 1060.814,594.753'/><polygon fill='green' stroke='#010101' stroke-miterlimit='10' points='1057.909,602.939 1049.363,604.521 1043.723,597.907 1046.628,589.714 1055.174,588.14 1060.814,594.753'/><polygon fill='green' stroke='#010101' stroke-miterlimit='10' points='1057.909,602.939 1049.363,604.521 1043.723,597.907 1046.628,589.714 1055.174,588.14 1060.814,594.753'/><polygon fill='green' stroke='#010101' stroke-miterlimit='10' points='1057.909,602.939 1049.363,604.521 1043.723,597.907 1046.628,589.714 1055.174,588.14 1060.814,594.753'/><polygon fill='green' stroke='#010101' stroke-miterlimit='10' points='1057.909,602.939 1049.363,604.521 1043.723,597.907 1046.628,589.714 1055.174,588.14 1060.814,594.753'/><polygon fill='green' stroke='#010101' stroke-miterlimit='10' points='1057.909,602.939 1049.363,604.521 1043.723,597.907 1046.628,589.714 1055.174,588.14 1060.814,594.753'/><polygon fill='green' stroke='#010101' stroke-miterlimit='10' points='1057.909,602.939 1049.363,604.521 1043.723,597.907 1046.628,589.714 1055.174,588.14 1060.814,594.753'/><polygon fill='green' stroke='#010101' stroke-miterlimit='10' points='1057.909,602.939 1049.363,604.521 1043.723,597.907 1046.628,589.714 1055.174,588.14 1060.814,594.753'/><polygon fill='green' stroke='#010101' stroke-miterlimit='10' points='1057.909,602.939 1049.363,604.521 1043.723,597.907 1046.628,589.714 1055.174,588.14 1060.814,594.753'/><polygon fill='green' stroke='#010101' stroke-miterlimit='10' points='1057.909,602.939 1049.363,604.521 1043.723,597.907 1046.628,589.714 1055.174,588.14 1060.814,594.753'/><polygon fill='green' stroke='#010101' stroke-miterlimit='10' points='1057.909,602.939 1049.363,604.521 1043.723,597.907 1046.628,589.714 1055.174,588.14 1060.814,594.753'/><polygon fill='green' stroke='#010101' stroke-miterlimit='10' points='1057.909,602.939 1049.363,604.521 1043.723,597.907 1046.628,589.714 1055.174,588.14 1060.814,594.753'/><polygon fill='green' stroke='#010101' stroke-miterlimit='10' points='1057.909,602.939 1049.363,604.521 1043.723,597.907 1046.628,589.714 1055.174,588.14 1060.814,594.753'/><polygon fill='green' stroke='#010101' stroke-miterlimit='10' points='1057.909,602.939 1049.363,604.521 1043.723,597.907 1046.628,589.714 1055.174,588.14 1060.814,594.753'/><polygon fill='green' stroke='#010101' stroke-miterlimit='10' points='1057.909,602.939 1049.363,604.521 1043.723,597.907 1046.628,589.714 1055.174,588.14 1060.814,594.753'/><polygon fill='green' stroke='#010101' stroke-miterlimit='10' points='1057.909,602.939 1049.363,604.521 1043.723,597.907 1046.628,589.714 1055.174,588.14 1060.814,594.753'/><polygon fill='green' stroke='#010101' stroke-miterlimit='10' points='1057.909,602.939 1049.363,604.521 1043.723,597.907 1046.628,589.714 1055.174,588.14 1060.814,594.753'/><polygon fill='green' stroke='#010101' stroke-miterlimit='10' points='1057.909,602.939 1049.363,604.521 1043.723,597.907 1046.628,589.714 1055.174,588.14 1060.814,594.753'/><polygon fill='green' stroke='#010101' stroke-miterlimit='10' points='1057.909,602.939 1049.363,604.521 1043.723,597.907 1046.628,589.714 1055.174,588.14 1060.814,594.753'/><polygon fill='green' stroke='#010101' stroke-miterlimit='10' points='1057.909,602.939 1049.363,604.521 1043.723,597.907 1046.628,589.714 1055.174,588.14 1060.814,594.753'/><polygon fill='green' stroke='#010101' stroke-miterlimit='10' points='1057.909,602.939 1049.363,604.521 1043.723,597.907 1046.628,589.714 1055.174,588.14 1060.814,594.753'/><polygon fill='green' stroke='#010101' stroke-miterlimit='10' points='1057.909,602.939 1049.363,604.521 1043.723,597.907 1046.628,589.714 1055.174,588.14 1060.814,594.753'/><polygon fill='green' stroke='#010101' stroke-miterlimit='10' points='1057.909,602.939 1049.363,604.521 1043.723,597.907 1046.628,589.714 1055.174,588.14 1060.814,594.753'/><polygon fill='green' stroke='#010101' stroke-miterlimit='10' points='1057.909,602.939 1049.363,604.521 1043.723,597.907 1046.628,589.714 1055.174,588.14 1060.814,594.753'/><polygon fill='green' stroke='#010101' stroke-miterlimit='10' points='1057.909,602.939 1049.363,604.521 1043.723,597.907 1046.628,589.714 1055.174,588.14 1060.814,594.753'/><polygon fill='green' stroke='#010101' stroke-miterlimit='10' points='1057.909,602.939 1049.363,604.521 1043.723,597.907 1046.628,589.714 1055.174,588.14 1060.814,594.753'/><polygon fill='green' stroke='#010101' stroke-miterlimit='10' points='1057.909,602.939 1049.363,604.521 1043.723,597.907 1046.628,589.714 1055.174,588.14 1060.814,594.753'/><polygon fill='green' stroke='#010101' stroke-miterlimit='10' points='1057.909,602.939 1049.363,604.521 1043.723,597.907 1046.628,589.714 1055.174,588.14 1060.814,594.753'/><polygon fill='green' stroke='#010101' stroke-miterlimit='10' points='1057.909,602.939 1049.363,604.521 1043.723,597.907 1046.628,589.714 1055.174,588.14 1060.814,594.753'/><polygon fill='green' stroke='#010101' stroke-miterlimit='10' points='1057.909,602.939 1049.363,604.521 1043.723,597.907 1046.628,589.714 1055.174,588.14 1060.814,594.753'/><g id='part24' class='part active' style='transform: translate(586.0717408999999px, -161.09737510000002px) rotate(90deg)'><path id='_x36_3-Science_x5F_Centre' fill='green' stroke='#ffffff' stroke-width='0.7056' stroke-linecap='round' stroke-linejoin='bevel' d='M 488.63399999999996 280.125 L 525.1724999999999 263.06775 C 525.1724999999999 263.06775 532.85925 286.53075 535.7782499999998 298.5495 C 539.0939999999999 312.20025000000004 541.6987499999999 326.067 543.5917499999999 340.02375 C 545.5065 354.1245 547.0484999999999 368.349 547.1624999999999 382.59675000000004 C 547.2734999999999 396.5295 545.7457499999998 410.43600000000004 544.3364999999999 424.28774999999996 C 543.0052499999999 437.37749999999994 541.4332499999998 450.46574999999996 539.0219999999998 463.3785 C 536.9167499999999 474.64725 534.5024999999998 485.8995 531.0494999999999 496.782 C 525.8362499999998 513.213 518.6159999999999 528.84 511.90049999999985 544.63425 C 508.02224999999976 553.7549999999999 499.6964999999998 571.71225 499.6964999999998 571.71225 L 488.7524999999998 586.07175 L 488.63399999999996 280.125 z' fill-opacity='1'/></g><g id='part24' class='part active' style='transform: translate(586.0717408999999px, -161.09737510000002px) rotate(90deg)'><path id='_x36_3-Science_x5F_Centre' fill='green' stroke='#ffffff' stroke-width='0.7056' stroke-linecap='round' stroke-linejoin='bevel' d='M 488.63399999999996 280.125 L 525.1724999999999 263.06775 C 525.1724999999999 263.06775 532.85925 286.53075 535.7782499999998 298.5495 C 539.0939999999999 312.20025000000004 541.6987499999999 326.067 543.5917499999999 340.02375 C 545.5065 354.1245 547.0484999999999 368.349 547.1624999999999 382.59675000000004 C 547.2734999999999 396.5295 545.7457499999998 410.43600000000004 544.3364999999999 424.28774999999996 C 543.0052499999999 437.37749999999994 541.4332499999998 450.46574999999996 539.0219999999998 463.3785 C 536.9167499999999 474.64725 534.5024999999998 485.8995 531.0494999999999 496.782 C 525.8362499999998 513.213 518.6159999999999 528.84 511.90049999999985 544.63425 C 508.02224999999976 553.7549999999999 499.6964999999998 571.71225 499.6964999999998 571.71225 L 488.7524999999998 586.07175 L 488.63399999999996 280.125 z' fill-opacity='1'/></g><g id='part24' class='part active' style='transform: translate(586.0717408999999px, -161.09737510000002px) rotate(90deg)'><path id='_x36_3-Science_x5F_Centre' fill='green' stroke='#ffffff' stroke-width='0.7056' stroke-linecap='round' stroke-linejoin='bevel' d='M 488.63399999999996 280.125 L 525.1724999999999 263.06775 C 525.1724999999999 263.06775 532.85925 286.53075 535.7782499999998 298.5495 C 539.0939999999999 312.20025000000004 541.6987499999999 326.067 543.5917499999999 340.02375 C 545.5065 354.1245 547.0484999999999 368.349 547.1624999999999 382.59675000000004 C 547.2734999999999 396.5295 545.7457499999998 410.43600000000004 544.3364999999999 424.28774999999996 C 543.0052499999999 437.37749999999994 541.4332499999998 450.46574999999996 539.0219999999998 463.3785 C 536.9167499999999 474.64725 534.5024999999998 485.8995 531.0494999999999 496.782 C 525.8362499999998 513.213 518.6159999999999 528.84 511.90049999999985 544.63425 C 508.02224999999976 553.7549999999999 499.6964999999998 571.71225 499.6964999999998 571.71225 L 488.7524999999998 586.07175 L 488.63399999999996 280.125 z' fill-opacity='1'/></g><g id='part24' class='part active' style='transform: translate(586.0717408999999px, -161.09737510000002px) rotate(90deg)'><path id='_x36_3-Science_x5F_Centre' fill='green' stroke='#ffffff' stroke-width='0.7056' stroke-linecap='round' stroke-linejoin='bevel' d='M 488.63399999999996 280.125 L 525.1724999999999 263.06775 C 525.1724999999999 263.06775 532.85925 286.53075 535.7782499999998 298.5495 C 539.0939999999999 312.20025000000004 541.6987499999999 326.067 543.5917499999999 340.02375 C 545.5065 354.1245 547.0484999999999 368.349 547.1624999999999 382.59675000000004 C 547.2734999999999 396.5295 545.7457499999998 410.43600000000004 544.3364999999999 424.28774999999996 C 543.0052499999999 437.37749999999994 541.4332499999998 450.46574999999996 539.0219999999998 463.3785 C 536.9167499999999 474.64725 534.5024999999998 485.8995 531.0494999999999 496.782 C 525.8362499999998 513.213 518.6159999999999 528.84 511.90049999999985 544.63425 C 508.02224999999976 553.7549999999999 499.6964999999998 571.71225 499.6964999999998 571.71225 L 488.7524999999998 586.07175 L 488.63399999999996 280.125 z' fill-opacity='1'/></g><g id='part24' class='part active' style='transform: translate(586.0717408999999px, -161.09737510000002px) rotate(90deg)'><path id='_x36_3-Science_x5F_Centre' fill='green' stroke='#ffffff' stroke-width='0.7056' stroke-linecap='round' stroke-linejoin='bevel' d='M 488.63399999999996 280.125 L 525.1724999999999 263.06775 C 525.1724999999999 263.06775 532.85925 286.53075 535.7782499999998 298.5495 C 539.0939999999999 312.20025000000004 541.6987499999999 326.067 543.5917499999999 340.02375 C 545.5065 354.1245 547.0484999999999 368.349 547.1624999999999 382.59675000000004 C 547.2734999999999 396.5295 545.7457499999998 410.43600000000004 544.3364999999999 424.28774999999996 C 543.0052499999999 437.37749999999994 541.4332499999998 450.46574999999996 539.0219999999998 463.3785 C 536.9167499999999 474.64725 534.5024999999998 485.8995 531.0494999999999 496.782 C 525.8362499999998 513.213 518.6159999999999 528.84 511.90049999999985 544.63425 C 508.02224999999976 553.7549999999999 499.6964999999998 571.71225 499.6964999999998 571.71225 L 488.7524999999998 586.07175 L 488.63399999999996 280.125 z' fill-opacity='1'/></g><g id='part24' class='part active' style='transform: translate(586.0717408999999px, -161.09737510000002px) rotate(90deg)'><path id='_x36_3-Science_x5F_Centre' fill='green' stroke='#ffffff' stroke-width='0.7056' stroke-linecap='round' stroke-linejoin='bevel' d='M 488.63399999999996 280.125 L 525.1724999999999 263.06775 C 525.1724999999999 263.06775 532.85925 286.53075 535.7782499999998 298.5495 C 539.0939999999999 312.20025000000004 541.6987499999999 326.067 543.5917499999999 340.02375 C 545.5065 354.1245 547.0484999999999 368.349 547.1624999999999 382.59675000000004 C 547.2734999999999 396.5295 545.7457499999998 410.43600000000004 544.3364999999999 424.28774999999996 C 543.0052499999999 437.37749999999994 541.4332499999998 450.46574999999996 539.0219999999998 463.3785 C 536.9167499999999 474.64725 534.5024999999998 485.8995 531.0494999999999 496.782 C 525.8362499999998 513.213 518.6159999999999 528.84 511.90049999999985 544.63425 C 508.02224999999976 553.7549999999999 499.6964999999998 571.71225 499.6964999999998 571.71225 L 488.7524999999998 586.07175 L 488.63399999999996 280.125 z' fill-opacity='1'/></g><g id='part24' class='part active' style='transform: translate(586.0717408999999px, -161.09737510000002px) rotate(90deg)'><path id='_x36_3-Science_x5F_Centre' fill='green' stroke='#ffffff' stroke-width='0.7056' stroke-linecap='round' stroke-linejoin='bevel' d='M 488.63399999999996 280.125 L 525.1724999999999 263.06775 C 525.1724999999999 263.06775 532.85925 286.53075 535.7782499999998 298.5495 C 539.0939999999999 312.20025000000004 541.6987499999999 326.067 543.5917499999999 340.02375 C 545.5065 354.1245 547.0484999999999 368.349 547.1624999999999 382.59675000000004 C 547.2734999999999 396.5295 545.7457499999998 410.43600000000004 544.3364999999999 424.28774999999996 C 543.0052499999999 437.37749999999994 541.4332499999998 450.46574999999996 539.0219999999998 463.3785 C 536.9167499999999 474.64725 534.5024999999998 485.8995 531.0494999999999 496.782 C 525.8362499999998 513.213 518.6159999999999 528.84 511.90049999999985 544.63425 C 508.02224999999976 553.7549999999999 499.6964999999998 571.71225 499.6964999999998 571.71225 L 488.7524999999998 586.07175 L 488.63399999999996 280.125 z' fill-opacity='1'/></g><g id='part24' class='part active' style='transform: translate(586.0717408999999px, -161.09737510000002px) rotate(90deg)'><path id='_x36_3-Science_x5F_Centre' fill='green' stroke='#ffffff' stroke-width='0.7056' stroke-linecap='round' stroke-linejoin='bevel' d='M 488.63399999999996 280.125 L 525.1724999999999 263.06775 C 525.1724999999999 263.06775 532.85925 286.53075 535.7782499999998 298.5495 C 539.0939999999999 312.20025000000004 541.6987499999999 326.067 543.5917499999999 340.02375 C 545.5065 354.1245 547.0484999999999 368.349 547.1624999999999 382.59675000000004 C 547.2734999999999 396.5295 545.7457499999998 410.43600000000004 544.3364999999999 424.28774999999996 C 543.0052499999999 437.37749999999994 541.4332499999998 450.46574999999996 539.0219999999998 463.3785 C 536.9167499999999 474.64725 534.5024999999998 485.8995 531.0494999999999 496.782 C 525.8362499999998 513.213 518.6159999999999 528.84 511.90049999999985 544.63425 C 508.02224999999976 553.7549999999999 499.6964999999998 571.71225 499.6964999999998 571.71225 L 488.7524999999998 586.07175 L 488.63399999999996 280.125 z' fill-opacity='1'/></g></svg>",
    "iterationCount": "5"
}`

const jsonObject = JSON.parse(jsonString);
const svgBin = jsonObject.svgBin;
const svgParts = jsonObject.svgParts;


const iterationCount = jsonObject.iterationCount;
// temporary directory to write bin and parts in order to send path to uploadFile(): TODO find a cleaner way to do it
fs.mkdirSync(tmpPath, { recursive: true });
fs.writeFileSync(path.join(tmpPath, 'bin.svg'), svgBin, 'utf-8');

fs.writeFileSync(path.join(tmpPath, 'parts.svg'), svgParts, 'utf-8');
const browser = await puppeteer.launch({ headless: false, protocolTimeout: 1200000, timeout: 2000000 });
const page = await browser.newPage();
page.setDefaultNavigationTimeout(1200000);

await page.goto('https://master--svg-nest.netlify.app/', { timeout: 0});
const partsPath = path.join(tmpPath, 'parts.svg');
const partsInput = await page.waitForSelector('#fileinput');

await partsInput.uploadFile(partsPath);
const binPath = path.join(tmpPath, 'bin.svg');
const binInput = await page.waitForSelector('#bininput');

await binInput.uploadFile(binPath);

fs.rmSync(tmpPath, { recursive: true, force: true });
const startButton = await page.waitForSelector('#start');

await startButton.click();

await waitForValueChange(page, '#info_iterations', iterationCount || defaultIterationCount, 0);
const sendButton = await page.waitForSelector('#sendresult');

await sendButton.click();

const output = await page.evaluate(() => {
    return localStorage.getItem('svgOutput');
});
console.log(output); // Outputs the stored SVG outerHTML


await browser.close();

printStatistics();



