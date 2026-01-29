import jsPDF from "jspdf";

interface AnalysisData {
    patientName: string;
    patientAge: string;
    patientGender: string;
    anb: number;
    overjet: number;
    isSuitable: boolean;
    landmarks: Record<string, { x: number; y: number }>;
    imageSrc: string;
    timestamp?: Date;
}

async function getLogoBase64(): Promise<string | null> {
    try {
        const res = await fetch("/logo.png");
        if (!res.ok) return null;
        const blob = await res.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch {
        return null;
    }
}

export async function generatePDFReport(data: AnalysisData): Promise<void> {
    const pdfDoc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
    });

    const pageWidth = pdfDoc.internal.pageSize.getWidth();
    const pageHeight = pdfDoc.internal.pageSize.getHeight();
    const margin = 15;

    // Logo at top (public/logo.png)
    const logoBase64 = await getLogoBase64();
    if (logoBase64) {
        const logoHeight = 18;
        const logoWidth = 50;
        pdfDoc.addImage(logoBase64, "PNG", (pageWidth - logoWidth) / 2, margin, logoWidth, logoHeight);
    }

    // Title
    let yPos = margin + (logoBase64 ? 22 : 0);
    pdfDoc.setFontSize(20);
    pdfDoc.setFont("helvetica", "bold");
    pdfDoc.text("Orthodontic Analysis Report", pageWidth / 2, yPos, { align: "center" });

    // Patient Information
    yPos += 15;
    pdfDoc.setFontSize(12);
    pdfDoc.setFont("helvetica", "bold");
    pdfDoc.text("Patient Information", margin, yPos);
    
    yPos += 8;
    pdfDoc.setFont("helvetica", "normal");
    pdfDoc.setFontSize(10);
    pdfDoc.text(`Name: ${data.patientName}`, margin, yPos);
    yPos += 6;
    pdfDoc.text(`Age: ${data.patientAge} years`, margin, yPos);
    yPos += 6;
    pdfDoc.text(`Gender: ${data.patientGender}`, margin, yPos);
    
    if (data.timestamp) {
        yPos += 6;
        pdfDoc.text(`Date: ${data.timestamp.toLocaleDateString()}`, margin, yPos);
    }

    // Analysis Results
    yPos += 15;
    pdfDoc.setFont("helvetica", "bold");
    pdfDoc.setFontSize(12);
    pdfDoc.text("Analysis Results", margin, yPos);
    
    yPos += 8;
    pdfDoc.setFont("helvetica", "normal");
    pdfDoc.setFontSize(10);
    pdfDoc.text(`ANB Angle: ${data.anb.toFixed(2)}°`, margin, yPos);
    yPos += 6;
    pdfDoc.text(`Overjet: ${data.overjet.toFixed(2)} mm`, margin, yPos);
    yPos += 6;
    
    // Clinical Criteria
    yPos += 5;
    pdfDoc.setFont("helvetica", "bold");
    pdfDoc.text("Clinical Criteria Assessment:", margin, yPos);
    yPos += 6;
    pdfDoc.setFont("helvetica", "normal");
    
    const anbMet = data.anb > 4.5;
    const overjetMet = data.overjet > 5.0;
    const ageNum = parseInt(data.patientAge);
    const ageMet = !isNaN(ageNum) && ageNum >= 9 && ageNum <= 15;
    
    pdfDoc.text(`ANB > 4.5°: ${anbMet ? "✓ Met" : "✗ Not Met"}`, margin + 5, yPos);
    yPos += 6;
    pdfDoc.text(`Overjet > 5mm: ${overjetMet ? "✓ Met" : "✗ Not Met"}`, margin + 5, yPos);
    yPos += 6;
    pdfDoc.text(`Age 9-15 years: ${ageMet ? "✓ Met" : "✗ Not Met"}`, margin + 5, yPos);
    
    // Overall Suitability
    yPos += 8;
    pdfDoc.setFont("helvetica", "bold");
    pdfDoc.setFontSize(12);
    pdfDoc.text(`Overall Suitability: ${data.isSuitable ? "Suitable" : "Not Suitable"}`, margin, yPos);
    
    // Recommendation
    yPos += 10;
    pdfDoc.setFont("helvetica", "normal");
    pdfDoc.setFontSize(10);
    const recommendation = data.isSuitable
        ? "The analysis suggests a skeletal Class II relationship suitable for functional appliance therapy. Monitor mandibular growth response."
        : "The skeletal pattern does not fully meet the criteria for functional appliance therapy. Consider alternative mechanics or extraction therapy.";
    
    const splitRecommendation = pdfDoc.splitTextToSize(recommendation, pageWidth - 2 * margin);
    pdfDoc.text(splitRecommendation, margin, yPos);

    // Detected Landmarks section removed per requirements

    // Add image if provided (on new page)
    if (data.imageSrc) {
        pdfDoc.addPage();
        try {
            const imgWidth = pageWidth - 2 * margin;
            const imgHeight = (imgWidth * 4) / 3;
            if (imgHeight > pageHeight - 2 * margin) {
                const scale = (pageHeight - 2 * margin) / imgHeight;
                pdfDoc.addImage(data.imageSrc, "JPEG", margin, margin, imgWidth * scale, imgHeight * scale);
            } else {
                pdfDoc.addImage(data.imageSrc, "JPEG", margin, margin, imgWidth, imgHeight);
            }
        } catch (error) {
            console.error("Error adding image to PDF:", error);
            pdfDoc.text("Image could not be included in PDF", margin, margin + 20);
        }
    }

    // Footer
    const totalPages = pdfDoc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        pdfDoc.setPage(i);
        pdfDoc.setFontSize(8);
        pdfDoc.setFont("helvetica", "italic");
        pdfDoc.text(
            `Page ${i} of ${totalPages} - InsightCeph`,
            pageWidth / 2,
            pageHeight - 10,
            { align: "center" }
        );
    }

    pdfDoc.save(`orthodontic-analysis-${data.patientName.replace(/\s+/g, "-")}-${Date.now()}.pdf`);
}
