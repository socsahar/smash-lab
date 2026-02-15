/**
 * Convert HEIC images to JPG using heic-convert
 */
const heicConvert = require('heic-convert');
const fs = require('fs');
const path = require('path');

const paintroom = path.join(__dirname, 'photos', 'paintroom');

async function convertImages() {
    const files = fs.readdirSync(paintroom);
    const heicFiles = files.filter(f => f.toLowerCase().endsWith('.heic'));
    
    console.log(`🔄 Converting ${heicFiles.length} HEIC files to JPG...\n`);

    for (const file of heicFiles) {
        const inputPath = path.join(paintroom, file);
        const outputName = file.replace(/\.HEIC$/i, '.jpg');
        const outputPath = path.join(paintroom, outputName);

        try {
            const inputBuffer = fs.readFileSync(inputPath);
            const outputBuffer = await heicConvert({
                buffer: inputBuffer,
                format: 'JPEG',
                quality: 0.85
            });
            fs.writeFileSync(outputPath, outputBuffer);
            const sizeKB = Math.round(outputBuffer.length / 1024);
            console.log(`✅ ${file} → ${outputName} (${sizeKB} KB)`);
        } catch (err) {
            console.log(`❌ ${file}: ${err.message}`);
        }
    }

    console.log('\n📁 Final folder contents:');
    fs.readdirSync(paintroom).forEach(f => {
        const size = Math.round(fs.statSync(path.join(paintroom, f)).size / 1024);
        console.log(`   ${f} (${size} KB)`);
    });
}

convertImages().then(() => console.log('\n🎉 Done!')).catch(console.error);
