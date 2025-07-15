function splitFloat32To16Bit(floatValue) {
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    view.setFloat32(0, floatValue, true);
    const lowRegister = view.getUint16(0, true);
    const highRegister = view.getUint16(2, true);
    
    return { lowRegister, highRegister };
}

const result = splitFloat32To16Bit(4.2);
console.log(result);