export const getFileMBSize = (file: File | undefined | string | Blob) => {
  if (typeof file === 'string') {
    return 0
  }
  if (file) {
    return file.size / 1024 / 1024
  } else {
    return 0
  }
}
export const isValidExtensionFile = (
  file: File | undefined | string | Blob,
  accepts: string[] = ['png', 'jpg', 'jpeg']
) => {
  if (typeof file === 'string') {
    return false
  }

  if (file) {
    const fileExtension = file.type.split('/')?.[1]
    return accepts.includes(fileExtension)
  } else {
    return false
  }
}
export const fileToDataURL = (file: File | string | Blob) => {
  return new Promise((resolve: (data: string) => any, reject) => {
    setTimeout(() => {
      if (typeof file === 'string') {
        return Promise.reject(new Error("File can't be a string"))
      }
      const reader = new FileReader()
      reader.onerror = reject
      reader.onload = (event) => {
        const base64 = (event as any).target.result
        resolve(base64)
      }
      reader.readAsDataURL(file)
    }, 200)
  })
}
