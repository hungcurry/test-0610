export default function () {

    const deleteEmptyKeys = (obj) => {
        for (let key in obj) {
          if (obj.hasOwnProperty(key)) {
            if (obj[key] === null || obj[key] === undefined || obj[key] === '') {
              delete obj[key]
            }
            if (typeof obj[key] === 'object') {
                deleteEmptyKeys(obj[key])
            }
          }
        }
      }
      return { deleteEmptyKeys }

}
