"use client"

import React, { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Upload, FileText, CheckCircle, AlertCircle, X, Info } from 'lucide-react'
import { importFromExcel, isValidExcelFile, getFileFormatInfo } from '@/lib/excel-import'
import type { RoutePoint, ImportResult } from '@/lib/types'

interface ExcelImportProps {
  onImportSuccess: (points: RoutePoint[]) => void
  onImportError: (error: string) => void
}

export default function ExcelImport({ onImportSuccess, onImportError }: ExcelImportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [showFormatInfo, setShowFormatInfo] = useState(false)

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    
    const file = files[0]
    
    // Validate file type
    if (!isValidExcelFile(file)) {
      onImportError('Tipo de arquivo inválido. Por favor, selecione um arquivo .xlsx, .xls ou .csv')
      return
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      onImportError('Arquivo muito grande. O tamanho máximo permitido é 10MB')
      return
    }

    setSelectedFile(file)
    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 100)

      const result: ImportResult = await importFromExcel(file)
      
      clearInterval(progressInterval)
      setUploadProgress(100)

      if (result.success && result.data) {
        setTimeout(() => {
          onImportSuccess(result.data!)
          setIsUploading(false)
          setUploadProgress(0)
          setSelectedFile(null)
        }, 500)
      } else {
        setIsUploading(false)
        setUploadProgress(0)
        onImportError(result.error || 'Erro desconhecido ao processar arquivo')
      }
    } catch (error) {
      setIsUploading(false)
      setUploadProgress(0)
      onImportError(`Erro ao processar arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files)
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  const clearSelection = () => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <FileText className="h-5 w-5" />
          Importar de Excel/CSV
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Format Information Toggle */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFormatInfo(!showFormatInfo)}
            className="text-muted-foreground hover:text-foreground"
          >
            <Info className="h-4 w-4 mr-2" />
            {showFormatInfo ? 'Ocultar' : 'Ver'} formato esperado
          </Button>
        </div>

        {showFormatInfo && (
          <Alert className="bg-muted/50 border-muted">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <pre className="text-xs whitespace-pre-wrap font-mono">
                {getFileFormatInfo()}
              </pre>
            </AlertDescription>
          </Alert>
        )}

        {/* File Upload Area */}
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
            dragActive
              ? 'border-primary bg-primary/5'
              : 'border-border bg-background hover:border-primary/50'
          } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center space-y-4">
            <Upload className={`h-8 w-8 ${dragActive ? 'text-primary' : 'text-muted-foreground'}`} />
            
            {!selectedFile ? (
              <div className="text-center">
                <p className="text-foreground font-medium">
                  Arraste e solte seu arquivo aqui
                </p>
                <p className="text-muted-foreground text-sm mt-1">
                  ou clique para selecionar
                </p>
                <div className="flex items-center justify-center mt-4">
                  <Button
                    onClick={openFileDialog}
                    disabled={isUploading}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    Selecionar Arquivo
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center w-full">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="text-foreground font-medium truncate max-w-xs">
                    {selectedFile.name}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {formatFileSize(selectedFile.size)}
                  </Badge>
                  {!isUploading && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearSelection}
                      className="h-6 w-6 p-0 hover:bg-destructive/10"
                    >
                      <X className="h-3 w-3 text-destructive" />
                    </Button>
                  )}
                </div>

                {isUploading && (
                  <div className="space-y-2">
                    <Progress value={uploadProgress} className="w-full" />
                    <p className="text-sm text-muted-foreground">
                      Processando arquivo... {uploadProgress}%
                    </p>
                  </div>
                )}

                {!isUploading && (
                  <div className="flex items-center justify-center gap-2 mt-3">
                    <Button
                      onClick={() => handleFiles(selectedFile ? new DataTransfer().files : null)}
                      disabled={isUploading}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Importar Dados
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* File type information */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-xs">
            .xlsx
          </Badge>
          <Badge variant="outline" className="text-xs">
            .xls
          </Badge>
          <Badge variant="outline" className="text-xs">
            .csv
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
