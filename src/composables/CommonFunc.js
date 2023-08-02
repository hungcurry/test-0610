export default function () {
  const deleteEmptyKeys = (obj) => {
    for (let key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        if (obj[key] === null || obj[key] === undefined || obj[key] === '') {
          delete obj[key]
        }
        if (typeof obj[key] === 'object') {
          deleteEmptyKeys(obj[key])
        }
      }
    }
  }
  const  setAllValuesToUndefinedRecursive = (obj) => {
    for (let key in obj) {
      // console.log(Object.prototype.hasOwnProperty.call(key))
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          setAllValuesToUndefinedRecursive(obj[key]);
        } else {
          obj[key] = undefined;
        }
      }
    }
  }
  return { deleteEmptyKeys, setAllValuesToUndefinedRecursive }
}
