const VERSION_NUMBER = 'v2020.8.8';
document.getElementById('version-number').innerHTML = VERSION_NUMBER;

const interactionSelectors = [
    'input-image-selector',
    'target-resolution-button',
    'stud-map-button',
    'hue-slider',
    'saturation-slider',
    'value-slider',
    'reset-colors-button',
    'use-bleedthrough-check',
    'download-instructions-button'
].map(id => document.getElementById(id));

function disableInteraction() {
    interactionSelectors.forEach(button => {
        button.disabled = true;
    });
}

function enableInteraction() {
    interactionSelectors.forEach(button => {
        button.disabled = false;
    });
}


let inputImage = null;

const inputCanvas = document.getElementById('input-canvas');
const inputCanvasContext = inputCanvas.getContext('2d');

const step1Canvas = document.getElementById('step-1-canvas')
const step1CanvasContext = step1Canvas.getContext('2d');
const step1CanvasUpscaled = document.getElementById('step-1-canvas-upscaled')
const step1CanvasUpscaledContext = step1CanvasUpscaled.getContext('2d');
step1CanvasContext.imageSmoothingQuality = "high";

const step2Canvas = document.getElementById('step-2-canvas')
const step2CanvasContext = step2Canvas.getContext('2d');
const step2CanvasUpscaled = document.getElementById('step-2-canvas-upscaled')
const step2CanvasUpscaledContext = step2CanvasUpscaled.getContext('2d');

const step3Canvas = document.getElementById('step-3-canvas')
const step3CanvasContext = step3Canvas.getContext('2d');
const step3CanvasUpscaled = document.getElementById('step-3-canvas-upscaled')
const step3CanvasUpscaledContext = step3CanvasUpscaled.getContext('2d');

const step4Canvas = document.getElementById('step-4-canvas')
const step4CanvasContext = step4Canvas.getContext('2d');
const step4CanvasUpscaled = document.getElementById('step-4-canvas-upscaled')
const step4CanvasUpscaledContext = step4CanvasUpscaled.getContext('2d');

const targetResolutions = [
    [32, 32],
    [48, 48],
    [32, 48],
    [48, 32],
    [16, 16]
]
let targetResolution = targetResolutions[1];
const SCALING_FACTOR = 40;
const PLATE_WIDTH = 16;

window.addEventListener("resize", () => {
    [step4Canvas].forEach(canvas => {
        canvas.height = window.getComputedStyle(canvas).width * targetResolution[1] / targetResolution[0];
    });
});

const DEFAULT_STUD_MAP = 'warhol_marilyn_monroe';
let selectedStudMap = STUD_MAPS[DEFAULT_STUD_MAP].studMap;
let selectedFullSetName = STUD_MAPS[DEFAULT_STUD_MAP].officialName;
let selectedSortedStuds = STUD_MAPS[DEFAULT_STUD_MAP].sortedStuds;
document.getElementById('stud-map-button').innerHTML = 'Input Set: ' + STUD_MAPS[DEFAULT_STUD_MAP].name;

const studMapOptions = document.getElementById(
    "stud-map-options"
);
studMapOptions.innerHTML = "";
Object.keys(STUD_MAPS).forEach(studMap => {
    const option = document.createElement("a");
    option.className = "dropdown-item btn";
    option.textContent = STUD_MAPS[studMap].name;
    option.value = studMap;
    option.addEventListener("click", () => {
        selectedStudMap = STUD_MAPS[studMap].studMap;
        selectedFullSetName = STUD_MAPS[studMap].officialName;
        selectedSortedStuds = STUD_MAPS[studMap].sortedStuds;
        document.getElementById('stud-map-button').innerHTML = 'Input Set: ' + STUD_MAPS[studMap].name;
        if (inputImage) {
            runStep1();
        }
    });
    studMapOptions.appendChild(option);
});

document.getElementById('target-resolution-button').innerHTML = `Target Resolution: ${targetResolution[0]}x${targetResolution[1]}`;
const targetResolutionOptions = document.getElementById(
    "target-resolution-options"
);
targetResolutionOptions.innerHTML = "";
targetResolutions.forEach(resolution => {
    const option = document.createElement("a");
    option.className = "dropdown-item btn";
    option.textContent = `${resolution[0]} X ${resolution[1]}`;
    option.value = resolution;
    option.addEventListener("click", () => {
        targetResolution = resolution;
        document.getElementById('target-resolution-button').innerHTML = `Target Resolution: ${targetResolution[0]}x${targetResolution[1]}`;
        if (inputImage) {
            runStep1();
        }
    });
    targetResolutionOptions.appendChild(option);
});

document.getElementById('hue-slider').addEventListener('change', () => {
    document.getElementById('hue-text').innerHTML = document.getElementById('hue-slider').value + '<span>&#176;</span>';
    runStep1();
}, false);

document.getElementById('saturation-slider').addEventListener('change', () => {
    document.getElementById('saturation-text').innerHTML = document.getElementById('saturation-slider').value + '%';
    runStep1();
}, false);

document.getElementById('value-slider').addEventListener('change', () => {
    document.getElementById('value-text').innerHTML = document.getElementById('value-slider').value + '%';
    runStep1();
}, false);

document.getElementById('reset-colors-button').addEventListener('click', () => {
    document.getElementById('hue-slider').value = 0;
    document.getElementById('saturation-slider').value = 0;
    document.getElementById('value-slider').value = 0;
    document.getElementById('hue-text').innerHTML = document.getElementById('hue-slider').value + '<span>&#176;</span>';
    document.getElementById('saturation-text').innerHTML = document.getElementById('saturation-slider').value + '%';
    document.getElementById('value-text').innerHTML = document.getElementById('value-slider').value + '%';
    runStep1();
}, false);

document.getElementById('use-bleedthrough-check').addEventListener('change', () => {
    runStep1();
}, false);

function runStep1() {
    disableInteraction();
    step1Canvas.width = targetResolution[0];
    step1Canvas.height = targetResolution[1];
    step1CanvasContext.drawImage(inputCanvas, 0, 0, targetResolution[0], targetResolution[1]);
    setTimeout(() => {
        runStep2();
        step1CanvasUpscaled.width = targetResolution[0] * SCALING_FACTOR;
        step1CanvasUpscaled.height = targetResolution[1] * SCALING_FACTOR;
        step1CanvasUpscaledContext.imageSmoothingEnabled = false;
        step1CanvasUpscaledContext.drawImage(step1Canvas, 0, 0, targetResolution[0] * SCALING_FACTOR, targetResolution[1] * SCALING_FACTOR);
    }, 1); // TODO: find better way to check that input is finished
}

function runStep2() {
    const inputPixelArray = getPixelArrayFromCanvas(step1Canvas);
    const filteredPixelArray = applyHSVAdjustment(inputPixelArray,
        document.getElementById('hue-slider').value,
        document.getElementById('saturation-slider').value / 100,
        document.getElementById('value-slider').value / 100,
    );
    step2Canvas.width = targetResolution[0];
    step2Canvas.height = targetResolution[1];
    drawPixelsOnCanvas(filteredPixelArray, step2Canvas);
    setTimeout(() => {
        runStep3();
        step2CanvasUpscaled.width = targetResolution[0] * SCALING_FACTOR;
        step2CanvasUpscaled.height = targetResolution[1] * SCALING_FACTOR;
        step2CanvasUpscaledContext.imageSmoothingEnabled = false;
        step2CanvasUpscaledContext.drawImage(step2Canvas, 0, 0, targetResolution[0] * SCALING_FACTOR, targetResolution[1] * SCALING_FACTOR);
    }, 1); // TODO: find better way to check that input is finished

}

function runStep3() {
    const fiteredPixelArray = getPixelArrayFromCanvas(step2Canvas);
    const alignedPixelArray = alignPixelsToStudMap(fiteredPixelArray,
        document.getElementById('use-bleedthrough-check').checked ? getDarkenedStudMap(selectedStudMap) : selectedStudMap);
    step3Canvas.width = targetResolution[0];
    step3Canvas.height = targetResolution[1];
    drawPixelsOnCanvas(alignedPixelArray, step3Canvas);
    setTimeout(() => {
        runStep4();
        step3CanvasUpscaledContext.imageSmoothingEnabled = false;
        drawStudImageOnCanvas(
            document.getElementById('use-bleedthrough-check').checked ? revertDarkenedImage(alignedPixelArray, getDarkenedStudsToStuds(Object.keys(selectedStudMap))) : alignedPixelArray,
            targetResolution[0], SCALING_FACTOR, step3CanvasUpscaled);
    }, 1); // TODO: find better way to check that input is finished
}


function runStep4(callback) {
    const step2PixelArray = getPixelArrayFromCanvas(step2Canvas);
    const step3PixelArray = getPixelArrayFromCanvas(step3Canvas);
    const availabilityCorrectedPixelArray = correctPixelsForAvailableStuds(step3PixelArray,
        document.getElementById('use-bleedthrough-check').checked ? getDarkenedStudMap(selectedStudMap) : selectedStudMap, step2PixelArray);
    step4Canvas.width = targetResolution[0];
    step4Canvas.height = targetResolution[1];
    drawPixelsOnCanvas(availabilityCorrectedPixelArray, step4Canvas);
    setTimeout(() => {
        enableInteraction();
        step4CanvasUpscaledContext.imageSmoothingEnabled = false;
        drawStudImageOnCanvas(
            document.getElementById('use-bleedthrough-check').checked ? revertDarkenedImage(availabilityCorrectedPixelArray, getDarkenedStudsToStuds(Object.keys(selectedStudMap))) : availabilityCorrectedPixelArray,
            targetResolution[0], SCALING_FACTOR, step4CanvasUpscaled);
        if (callback) {
            callback();
        }
    }, 1); // TODO: find better way to check that input is finished
}

function addWaterMark(pdf) {
    for (let i = 0; i < pdf.internal.getNumberOfPages(); i++) {
        pdf.setPage(i + 1);
        pdf.setFontSize(20);
        pdf.setTextColor(200);
        pdf.text(pdf.internal.pageSize.height * 0.25, pdf.internal.pageSize.height * 0.30, 'Generated by lego-art-remix.debkbanerji.com');
        pdf.text(pdf.internal.pageSize.height * 0.25, pdf.internal.pageSize.height * 0.30 + 10, VERSION_NUMBER);
    }
}

function generateInstructions() {
    const instructionsCanvasContainer = document.getElementById('instructions-canvas-container');
    instructionsCanvasContainer.innerHTML = '';
    disableInteraction();
    runStep4(() => {

        const step4PixelArray = getPixelArrayFromCanvas(step4Canvas);
        const resultImage = document.getElementById('use-bleedthrough-check').checked ? revertDarkenedImage(step4PixelArray, getDarkenedStudsToStuds(Object.keys(selectedStudMap))) : step4PixelArray;

        const titlePageCanvas = document.createElement("canvas");
        instructionsCanvasContainer.appendChild(titlePageCanvas);
        generateInstructionTitlePage(resultImage, targetResolution[0], PLATE_WIDTH, selectedSortedStuds, SCALING_FACTOR, titlePageCanvas, selectedFullSetName);

        const imgData = titlePageCanvas.toDataURL("image/png", 1.0);

        const pdf = new jsPDF({
            orientation: 'l',
            unit: 'mm',
            format: [titlePageCanvas.width, titlePageCanvas.height]
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfWidth * titlePageCanvas.height / titlePageCanvas.width);

        const totalPlates = resultImage.length / (4 * PLATE_WIDTH * PLATE_WIDTH);
        for (var i = 0; i < totalPlates; i++) {
            const instructionPageCanvas = document.createElement("canvas");
            instructionsCanvasContainer.appendChild(instructionPageCanvas);

            const subPixelArray = getSubPixelArray(resultImage, i, targetResolution[0], PLATE_WIDTH);
            generateInstructionPage(subPixelArray, PLATE_WIDTH, selectedSortedStuds, SCALING_FACTOR, instructionPageCanvas, i + 1);

            const imgData = instructionPageCanvas.toDataURL(`image${i+1}/jpeg`, i);

            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfWidth * instructionPageCanvas.height / instructionPageCanvas.width);
        }

        addWaterMark(pdf);
        pdf.save("Lego-Art-Remix-Instructions.pdf");
        enableInteraction();
    });
}


document.getElementById('download-instructions-button').addEventListener("click", () => {
    generateInstructions();
});

function handleInputImage(e) {
    const reader = new FileReader();
    reader.onload = function(event) {
        inputImage = new Image();
        inputImage.onload = function() {
            inputCanvas.width = inputImage.width;
            inputCanvas.height = inputImage.height;
            inputCanvasContext.drawImage(inputImage, 0, 0);
        }
        inputImage.src = event.target.result;
        document.getElementById('steps-row').hidden = false;
        document.getElementById('input-image-text').innerHTML = 'Reselect Input Image';
        setTimeout(() => {
            runStep1();
        }, 20); // TODO: find better way to check that input is finished
    }
    reader.readAsDataURL(e.target.files[0]);
}


const imageSelector = document.getElementById('input-image-selector');
imageSelector.addEventListener('change', handleInputImage, false);