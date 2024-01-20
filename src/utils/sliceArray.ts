export function sliceArrays(array: Array<any>, array_size: number) {
    const sliced_array = [];

    for (let i = 0; i <array.length; i += array_size) {
        sliced_array.push(array.slice(i, i + array_size));
    }
    return sliced_array;
}