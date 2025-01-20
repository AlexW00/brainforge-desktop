/// <reference types="vite/client" />
import type { FileSystemAPI } from '../../types/files'

declare global {
  interface Window {
    api: FileSystemAPI
  }
}
