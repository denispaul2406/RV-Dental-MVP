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

export async function generatePDFReport(data: AnalysisData): Promise<void> {
    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;

    // Title
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Orthodontic Analysis Report", pageWidth / 2, margin, { align: "center" });

    // Patient Information
    let yPos = margin + 15;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Patient Information", margin, yPos);
    
    yPos += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Name: ${data.patientName}`, margin, yPos);
    yPos += 6;
    doc.text(`Age: ${data.patientAge} years`, margin, yPos);
    yPos += 6;
    doc.text(`Gender: ${data.patientGender}`, margin, yPos);
    
    if (data.timestamp) {
        yPos += 6;
        doc.text(`Date: ${data.timestamp.toLocaleDateString()}`, margin, yPos);
    }

    // Analysis Results
    yPos += 15;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Analysis Results", margin, yPos);
    
    yPos += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`ANB Angle: ${data.anb.toFixed(2)}°`, margin, yPos);
    yPos += 6;
    doc.text(`Overjet: ${data.overjet.toFixed(2)} mm`, margin, yPos);
    yPos += 6;
    
    // Clinical Criteria
    yPos += 5;
    doc.setFont("helvetica", "bold");
    doc.text("Clinical Criteria Assessment:", margin, yPos);
    yPos += 6;
    doc.setFont("helvetica", "normal");
    
    const anbMet = data.anb > 4.5;
    const overjetMet = data.overjet > 5.0;
    const ageNum = parseInt(data.patientAge);
    const ageMet = !isNaN(ageNum) && ageNum >= 9 && ageNum <= 15;
    
    doc.text(`ANB > 4.5°: ${anbMet ? "✓ Met" : "✗ Not Met"}`, margin + 5, yPos);
    yPos += 6;
    doc.text(`Overjet > 5mm: ${overjetMet ? "✓ Met" : "✗ Not Met"}`, margin + 5, yPos);
    yPos += 6;
    doc.text(`Age 9-15 years: ${ageMet ? "✓ Met" : "✗ Not Met"}`, margin + 5, yPos);
    
    // Overall Suitability
    yPos += 8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(`Overall Suitability: ${data.isSuitable ? "Suitable" : "Not Suitable"}`, margin, yPos);
    
    // Recommendation
    yPos += 10;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const recommendation = data.isSuitable
        ? "The analysis suggests a skeletal Class II relationship suitable for functional appliance therapy. Monitor mandibular growth response."
        : "The skeletal pattern does not fully meet the criteria for functional appliance therapy. Consider alternative mechanics or extraction therapy.";
    
    const splitRecommendation = doc.splitTextToSize(recommendation, pageWidth - 2 * margin);
    doc.text(splitRecommendation, margin, yPos);

    // Landmarks
    yPos += splitRecommendation.length * 5 + 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Detected Landmarks (Normalized Coordinates)", margin, yPos);
    
    yPos += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    Object.entries(data.landmarks).forEach(([name, point]) => {
        const displayNames: Record<string, string> = {
            S: "Sella",
            N: "Nasion",
            A: "Point A",
            B: "Point B"
        };
        doc.text(`${displayNames[name] || name}: (${point.x.toFixed(2)}%, ${point.y.toFixed(2)}%)`, margin + 5, yPos);
        yPos += 5;
    });

    // Add image if provided (on new page)
    if (data.imageSrc) {
        doc.addPage();
        try {
            // Convert base64 to image and add to PDF
            const imgWidth = pageWidth - 2 * margin;
            const imgHeight = (imgWidth * 4) / 3; // Maintain aspect ratio
            
            // Check if image fits on page
            if (imgHeight > pageHeight - 2 * margin) {
                // Scale down to fit
                const scale = (pageHeight - 2 * margin) / imgHeight;
                doc.addImage(data.imageSrc, "JPEG", margin, margin, imgWidth * scale, imgHeight * scale);
            } else {
                doc.addImage(data.imageSrc, "JPEG", margin, margin, imgWidth, imgHeight);
            }
        } catch (error) {
            console.error("Error adding image to PDF:", error);
            doc.text("Image could not be included in PDF", margin, margin + 20);
        }
    }

    // Footer
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont("helvetica", "italic");
        doc.text(
            `Page ${i} of ${totalPages} - OrthoVision AI`,
            pageWidth / 2,
            pageHeight - 10,
            { align: "center" }
        );
    }

    // Save PDF
    doc.save(`orthodontic-analysis-${data.patientName.replace(/\s+/g, "-")}-${Date.now()}.pdf`);
}
