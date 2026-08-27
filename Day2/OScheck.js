const os = require("os");

function getCPUinfo() {
  const cpus = os.cpus();
  return cpus.map((cpu, index) => 'CPU ' + index + ': ' + cpu.model + ' - Speed: ' + cpu.speed + ' MHz').join('\n');
}

function getMemoryInfo() {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    return `Total Memory: ${totalMemory} bytes\nFree Memory: ${freeMemory} bytes\nUsed Memory: ${usedMemory} bytes`;
}

module.exports = {
    getCPUinfo,
    getMemoryInfo
}