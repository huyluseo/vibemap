const { Jimp } = require('jimp');
const path = require('path');
const fs = require('fs');

const inputFile = '/home/vibemap/android/app/src/main/ne.png';
const baseDir = '/home/vibemap/android/app/src/main/res';

// Notification icon sizes (approximate guidelines for mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi)
// Base size 24dp.
// mdpi: 24px
// hdpi: 36px
// xhdpi: 48px
// xxhdpi: 72px
// xxxhdpi: 96px

const configs = [
    { dir: 'mipmap-mdpi', size: 24 },
    { dir: 'mipmap-hdpi', size: 36 },
    { dir: 'mipmap-xhdpi', size: 48 },
    { dir: 'mipmap-xxhdpi', size: 72 },
    { dir: 'mipmap-xxxhdpi', size: 96 },
];

async function processIcons() {
    try {
        if (!fs.existsSync(inputFile)) {
            console.error(`Input file not found: ${inputFile}`);
            process.exit(1);
        }

        console.log(`Reading input: ${inputFile}`);
        const image = await Jimp.read(inputFile);

        for (const config of configs) {
            const targetDir = path.join(baseDir, config.dir);
            if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
            }

            // Resize and save as ic_notification.png
            const icon = image.clone().resize({ w: config.size, h: config.size });
            const targetPath = path.join(targetDir, 'ic_notification.png');
            await icon.write(targetPath);
            console.log(`Saved ${config.dir}/ic_notification.png (${config.size}px)`);
        }
        console.log("Notification icons processed successfully!");
    } catch (err) {
        console.error("Error processing icons:", err);
        process.exit(1);
    }
}

processIcons();
