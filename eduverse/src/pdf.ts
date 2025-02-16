import { getDocument } from "pdfjs-dist";
import * as THREE from "three";

export async function loadPDF(pdfUrl: string) {
  const pdf = await getDocument(pdfUrl).promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 2.0 });
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const renderContext = {
    canvasContext: ctx,
    viewport: viewport,
  };
  await page.render(renderContext).promise;
  const texture = new THREE.CanvasTexture(canvas);
  const geometry = new THREE.PlaneGeometry(
    canvas.width / 100,
    canvas.height / 100
  );
  const material = new THREE.MeshBasicMaterial({ map: texture });
  return new THREE.Mesh(geometry, material);
}
