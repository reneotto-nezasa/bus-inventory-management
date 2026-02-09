let pdfMakeInstance: any = null;

export async function getPdfMake() {
  if (pdfMakeInstance) {
    return pdfMakeInstance;
  }

  try {
    const pdfMakeModule = await import('pdfmake/build/pdfmake');
    const pdfFontsModule = await import('pdfmake/build/vfs_fonts');

    const pdfMake = pdfMakeModule.default;
    pdfMake.vfs = pdfFontsModule.default.pdfMake.vfs;

    pdfMakeInstance = pdfMake;
    return pdfMake;
  } catch (error) {
    console.error('Failed to load pdfMake:', error);
    throw new Error('PDF generation library could not be loaded');
  }
}

export default {
  createPdf: async (...args: any[]) => {
    const pdfMake = await getPdfMake();
    return pdfMake.createPdf(...args);
  }
};
