
/**
 * Generates a self-contained HTML snippet for html2pdf.js rendering.
 * Uses only inline styles with hardcoded hex values â€” html2canvas cannot
 * resolve CSS custom properties (var(--x)) or load external @import fonts.
 * @param {Object} prescription
 * @returns {string}
 */
export function generatePrescriptionContent(prescription) {
  const p = prescription;

  const date = new Date(p.createdAt).toLocaleString([], {
    month: 'long', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const medicinesHtml = (p.medicines || [])
    .map((med, i) => `
      <div style="display:flex;align-items:flex-start;border:1px solid #dde3ea;border-radius:8px;overflow:hidden;background:#ffffff;margin-bottom:6px;">
        <div style="width:44px;min-width:44px;background:#0f1f3d;color:#ffffff;font-size:15px;font-weight:700;display:flex;align-items:center;justify-content:center;min-height:60px;">${String(i + 1).padStart(2, '0')}</div>
        <div style="flex:1;padding:12px 16px;">
          <div style="font-size:14px;font-weight:700;color:#0f1f3d;margin-bottom:6px;">${med.name}</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <span style="font-size:10px;font-weight:600;padding:3px 10px;border-radius:4px;background:#e8f4fd;color:#1a6896;">Dosage: ${med.dosage}</span>
            <span style="font-size:10px;font-weight:600;padding:3px 10px;border-radius:4px;background:#e6f4f1;color:#0d7c66;">Duration: ${med.duration}</span>
          </div>
          ${med.instructions ? `<div style="margin-top:8px;font-size:11px;color:#6b7a8d;padding-top:8px;border-top:1px dashed #dde3ea;">${med.instructions}</div>` : ''}
        </div>
      </div>`)
    .join('');

  const notesSection = p.notes
    ? `<div style="margin-top:20px;">
        <div style="font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#0f1f3d;display:flex;align-items:center;gap:8px;margin-bottom:10px;">
          <span style="display:inline-block;width:3px;height:14px;background:#0d7c66;border-radius:2px;"></span>Clinical Notes
        </div>
        <div style="background:#fdf6e3;border:1px solid #e8d9a8;border-left:3px solid #c9a84c;border-radius:0 8px 8px 0;padding:14px 18px;font-size:13px;color:#1c2b3a;line-height:1.7;">${p.notes}</div>
      </div>`
    : '';

  return `
<div style="width:794px;height:1123px;background:#ffffff;font-family:Georgia,serif;color:#1c2b3a;display:flex;flex-direction:column;">

  <div style="height:6px;background:linear-gradient(90deg,#0f1f3d 0%,#0d7c66 60%,#c9a84c 100%);"></div>

  <div style="display:flex;align-items:flex-start;justify-content:space-between;padding:28px 40px 22px;border-bottom:1px solid #dde3ea;">
    <div>
      <div style="font-size:22px;font-weight:700;color:#0f1f3d;">HealthConnect</div>
      <div style="font-size:10px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#0d7c66;margin-top:3px;">Medical Platform Â· Digital Prescription</div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:11px;color:#6b7a8d;">${date}</div>
    </div>
  </div>

  <div style="flex:1;padding:28px 40px;overflow:hidden;">

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0;background:#f7f9fb;border:1px solid #dde3ea;border-radius:10px;overflow:hidden;margin-bottom:22px;">
      <div style="padding:18px 22px;border-right:1px solid #dde3ea;">
        <div style="font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#0d7c66;margin-bottom:6px;">Patient</div>
        <div style="font-size:17px;font-weight:700;color:#0f1f3d;">${p.patient_id.name}</div>
        <div style="font-size:11px;color:#6b7a8d;margin-top:3px;">${p.patient_id.email || ''}</div>
      </div>
      <div style="padding:18px 22px;">
        <div style="font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#0d7c66;margin-bottom:6px;">Prescribing Physician</div>
        <div style="font-size:17px;font-weight:700;color:#0f1f3d;">Dr. ${p.doctor_id.name}</div>
        <div style="font-size:11px;color:#6b7a8d;margin-top:3px;">Certified Specialist</div>
      </div>
    </div>

    <div style="margin-bottom:22px;">
      <div style="font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#0f1f3d;display:flex;align-items:center;gap:8px;margin-bottom:10px;">
        <span style="display:inline-block;width:3px;height:14px;background:#0d7c66;border-radius:2px;flex-shrink:0;"></span>Diagnosis &amp; Findings
      </div>
      <div style="background:#f7f9fb;border:1px solid #dde3ea;border-left:3px solid #0f1f3d;border-radius:0 8px 8px 0;padding:14px 18px;font-size:14px;color:#1c2b3a;line-height:1.7;">${p.diagnosis}</div>
    </div>

    <div style="margin-bottom:22px;">
      <div style="font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#0f1f3d;display:flex;align-items:center;gap:8px;margin-bottom:10px;">
        <span style="display:inline-block;width:3px;height:14px;background:#0d7c66;border-radius:2px;flex-shrink:0;"></span>Prescribed Medications
      </div>
      ${medicinesHtml}
    </div>

    ${notesSection}

  </div>

  <div style="border-top:1px solid #dde3ea;padding:18px 40px;display:flex;align-items:flex-end;justify-content:space-between;">
    <div>
      <div style="font-size:12px;font-weight:700;color:#0f1f3d;">HealthConnect Medical Platform</div>
      <div style="font-size:9px;color:#6b7a8d;margin-top:3px;">Generated on ${new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })} Â· Digitally issued prescription.</div>
    </div>
    <div style="text-align:center;">
      <div style="width:140px;border-bottom:1.5px solid #0f1f3d;margin-bottom:6px;"></div>
      <div style="font-size:9px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#6b7a8d;">Doctor's Signature</div>
    </div>
  </div>

  <div style="height:4px;background:linear-gradient(90deg,#c9a84c 0%,#0d7c66 50%,#0f1f3d 100%);"></div>

</div>`;
}
