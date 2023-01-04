/**
 * @desc General file uploader

 */

import { useRef } from 'veact'
import { useLoading } from 'veact-use'
import { uploadStaticToNodePress } from '@/store_api/system'

const UPLOAD_FILE_SIZE_LIMIT = 3000000

export enum UploadErrorCode {
  FileSizeLimit = 'fileSizeLimit',
  Failure = 'failure',
}

export interface UploaderOptions {
  onProgress?(percent: number): void
}

export const useUploader = () => {
  const uploading = useLoading()
  const progressing = useRef(false)
  const progress = useRef(0)

  const upload = (file: File, fileName: string | null = null, options?: UploaderOptions) => {
    // file size
    if (file.size > UPLOAD_FILE_SIZE_LIMIT) {
      return Promise.reject({ code: UploadErrorCode.FileSizeLimit })
    }

    progressing.value = true
    progress.value = 0

    // upload file
    const _fileName = (fileName ?? file.name).replace(/ /gi, '')
    console.info('[upoader]', '', _fileName)
    return uploading.promise(
      uploadStaticToNodePress({
        file,
        name: _fileName,
        onProgress: (_progress) => {
          console.info('[upoader]', '', _progress)
          progressing.value = true
          progress.value = _progress * 100
          options?.onProgress?.(_progress)
        },
      })
        .then((result) => {
          console.info('[upoader]', '', result.url)
          return result
        })
        .catch((error) => {
          console.warn('[upoader]', '', error)
          return Promise.reject({
            code: UploadErrorCode.Failure,
            error,
          })
        })
        .finally(() => {
          progressing.value = false
        })
    )
  }

  return {
    upload,
    uploading,
    progressing,
    progress,
  }
}
