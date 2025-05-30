// src/app/services/image-processing.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ImageProcessingService {

  async cropToSquare(file: File): Promise<File> {
    const imageBitmap = await createImageBitmap(file);
    const minSize = Math.min(imageBitmap.width, imageBitmap.height);

    // Calcula el punto de inicio del recorte centrado
    const sx = (imageBitmap.width - minSize) / 2;
    const sy = (imageBitmap.height - minSize) / 2;

    // Creamos un canvas cuadrado
    const canvas = document.createElement('canvas');
    canvas.width = minSize;
    canvas.height = minSize;
    const ctx = canvas.getContext('2d');

    if (!ctx) throw new Error("No se pudo obtener el contexto 2D del canvas");

    ctx.drawImage(
      imageBitmap,
      sx, sy, minSize, minSize, // Recorte de la imagen original
      0, 0, minSize, minSize     // Dibujo en el canvas
    );

    return new Promise<File>((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) throw new Error("No se pudo convertir el canvas a blob");
        const squaredFile = new File([blob], file.name, { type: 'image/png' });
        resolve(squaredFile);
      }, 'image/png');
    });
  }

  async convertToPng(file: File): Promise<File> {
    const imageBitmap = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    canvas.width = imageBitmap.width;
    canvas.height = imageBitmap.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("No se pudo obtener contexto del canvas");

    ctx.drawImage(imageBitmap, 0, 0);

    return new Promise<File>((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) throw new Error("No se pudo convertir a PNG");
        const pngFile = new File([blob], file.name.replace(/\.\w+$/, ".png"), { type: 'image/png' });
        resolve(pngFile);
      }, 'image/png');
    });
  }



}
