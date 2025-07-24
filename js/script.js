// ===== VARIABLES GLOBALES =====
let educationCount = 1
let courseCount = 1
let experienceCount = 1
let currentFormData = {}
let autoSaveEnabled = true
let autoSaveTimer = null
let currentTemplate = "classic"

// ===== INICIALIZACIÓN =====
document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 Inicializando Generador de CV ATS v2.0...")
  initializeApp()
})

function initializeApp() {
  try {
    // Configurar event listeners
    setupEventListeners()

    // Configurar validaciones en tiempo real
    setupRealTimeValidation()

    // Configurar contadores de caracteres
    setupCharacterCounters()

    // Configurar guardado automático
    setupAutoSave()

    // Configurar tema
    setupTheme()

    // Cargar datos guardados si existen
    loadSavedData()

    // Actualizar progreso inicial
    updateProgress()

    console.log("✅ Aplicación inicializada correctamente")
    showToast("¡Bienvenido!", "Aplicación cargada correctamente", "success")
  } catch (error) {
    console.error("❌ Error al inicializar la aplicación:", error)
    showToast("Error", "Error al inicializar la aplicación", "error")
  }
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
  // Formulario principal
  const form = document.getElementById("cv-form")
  form.addEventListener("submit", handleFormSubmit)

  // Botones principales
  document.getElementById("clear-form").addEventListener("click", clearForm)
  document.getElementById("edit-cv").addEventListener("click", editCV)
  document.getElementById("print-cv").addEventListener("click", printCV)
  document.getElementById("download-pdf").addEventListener("click", downloadPDF)
  document.getElementById("download-word").addEventListener("click", downloadWord)
  document.getElementById("share-cv").addEventListener("click", shareCV)

  // Botones de toolbar
  document.getElementById("theme-toggle").addEventListener("click", toggleTheme)
  document.getElementById("auto-save-toggle").addEventListener("click", toggleAutoSave)
  document.getElementById("import-data").addEventListener("click", () => openModal("import-modal"))
  document.getElementById("export-data").addEventListener("click", exportData)

  // Selector de plantillas
  document.getElementById("template-selector").addEventListener("change", changeTemplate)

  // Botones para agregar items dinámicos
  document.getElementById("add-education").addEventListener("click", addEducationItem)
  document.getElementById("add-course").addEventListener("click", addCourseItem)
  document.getElementById("add-experience").addEventListener("click", addExperienceItem)

  // Upload de firma
  document.getElementById("signature").addEventListener("change", handleSignatureUpload)

  // Importar datos
  document.getElementById("confirm-import").addEventListener("click", importData)
  document.getElementById("import-file").addEventListener("change", handleFileSelect)

  // Copiar enlace
  document.getElementById("copy-link").addEventListener("click", copyShareLink)

  // Actualizar progreso en tiempo real
  const inputs = form.querySelectorAll("input, textarea, select")
  inputs.forEach((input) => {
    input.addEventListener(
      "input",
      debounce(() => {
        updateProgress()
        if (autoSaveEnabled) {
          scheduleAutoSave()
        }
      }, 300),
    )
    input.addEventListener(
      "change",
      debounce(() => {
        updateProgress()
        if (autoSaveEnabled) {
          scheduleAutoSave()
        }
      }, 300),
    )
  })
}

// ===== TEMA OSCURO/CLARO =====
function setupTheme() {
  const savedTheme = localStorage.getItem("cv-theme") || "light"
  applyTheme(savedTheme)
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme") || "light"
  const newTheme = currentTheme === "light" ? "dark" : "light"
  applyTheme(newTheme)
  localStorage.setItem("cv-theme", newTheme)

  showToast("Tema cambiado", `Modo ${newTheme === "dark" ? "oscuro" : "claro"} activado`, "info")
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme)
  const themeIcon = document.querySelector(".theme-icon")
  themeIcon.textContent = theme === "dark" ? "☀️" : "🌙"
}

// ===== GUARDADO AUTOMÁTICO =====
function setupAutoSave() {
  const autoSaveToggle = document.getElementById("auto-save-toggle")
  const saveStatus = document.getElementById("save-status")

  autoSaveEnabled = localStorage.getItem("auto-save-enabled") !== "false"
  updateAutoSaveUI()
}

function toggleAutoSave() {
  autoSaveEnabled = !autoSaveEnabled
  localStorage.setItem("auto-save-enabled", autoSaveEnabled)
  updateAutoSaveUI()

  if (autoSaveEnabled) {
    showToast("Guardado automático", "Activado correctamente", "success")
    scheduleAutoSave()
  } else {
    showToast("Guardado automático", "Desactivado", "info")
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer)
    }
  }
}

function updateAutoSaveUI() {
  const toggle = document.getElementById("auto-save-toggle")
  const status = document.getElementById("save-status")

  if (autoSaveEnabled) {
    toggle.classList.add("active")
    status.textContent = "Guardado automático activado"
    status.style.color = "var(--success-color)"
  } else {
    toggle.classList.remove("active")
    status.textContent = "Guardado automático desactivado"
    status.style.color = "var(--gray-500)"
  }
}

function scheduleAutoSave() {
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer)
  }

  autoSaveTimer = setTimeout(() => {
    const formData = collectFormData()
    saveFormData(formData)
    showSaveIndicator()
  }, 2000) // Guardar después de 2 segundos de inactividad
}

function showSaveIndicator() {
  const status = document.getElementById("save-status")
  const originalText = status.textContent

  status.textContent = "💾 Guardando..."
  status.style.color = "var(--primary-color)"

  setTimeout(() => {
    status.textContent = "✅ Guardado"
    status.style.color = "var(--success-color)"

    setTimeout(() => {
      updateAutoSaveUI()
    }, 1000)
  }, 500)
}

// ===== PLANTILLAS DE CV =====
function changeTemplate(event) {
  currentTemplate = event.target.value
  const cvContent = document.getElementById("cv-content")

  // Remover clases de plantilla anteriores
  cvContent.classList.remove("template-classic", "template-modern", "template-minimal")

  // Agregar nueva clase de plantilla
  cvContent.classList.add(`template-${currentTemplate}`)

  showToast("Plantilla cambiada", `Plantilla ${currentTemplate} aplicada`, "success")

  // Guardar preferencia
  localStorage.setItem("cv-template", currentTemplate)
}

// ===== DESCARGA PDF MEJORADA CON PAGINACIÓN CORRECTA =====
async function downloadPDF() {
  const button = document.getElementById("download-pdf")
  button.classList.add("loading")

  try {
    showToast("Generando PDF", "Preparando tu CV para descarga...", "info")

    const cvContent = document.getElementById("cv-content")

    // Crear una copia temporal del contenido para optimizar para PDF
    const tempContainer = document.createElement("div")
    tempContainer.innerHTML = cvContent.innerHTML
    tempContainer.style.cssText = `
      width: 794px;
      min-height: 1123px;
      padding: 60px 80px;
      margin: 0;
      background: white;
      font-family: 'Times New Roman', serif;
      font-size: 11pt;
      line-height: 1.4;
      color: #000;
      position: absolute;
      top: -9999px;
      left: -9999px;
      box-sizing: border-box;
    `

    // Aplicar estilos específicos para PDF
    const pdfStyles = `
      * {
        box-sizing: border-box;
      }
      
      .cv-header {
        text-align: center;
        margin-bottom: 25px;
        padding-bottom: 15px;
        border-bottom: 2px solid #000;
        page-break-after: avoid;
      }
      
      .cv-header h1 {
        font-size: 16pt;
        font-weight: bold;
        margin-bottom: 15px;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: #000;
        line-height: 1.2;
      }
      
      .cv-contact {
        font-size: 10pt;
        margin-bottom: 8px;
        color: #000;
        line-height: 1.3;
      }
      
      .cv-contact p {
        margin-bottom: 5px;
      }
      
      .cv-section {
        margin-bottom: 20px;
        page-break-inside: avoid;
      }
      
      .cv-section h2 {
        font-size: 12pt;
        font-weight: bold;
        text-transform: uppercase;
        border-bottom: 1px solid #000;
        padding-bottom: 5px;
        margin-bottom: 15px;
        letter-spacing: 0.5px;
        color: #000;
        page-break-after: avoid;
      }
      
      .cv-item {
        margin-bottom: 15px;
        page-break-inside: avoid;
      }
      
      .cv-item-header {
        margin-bottom: 8px;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        flex-wrap: wrap;
        gap: 10px;
      }
      
      .cv-item-title {
        font-weight: bold;
        font-size: 11pt;
        color: #000;
        margin-bottom: 3px;
      }
      
      .cv-item-subtitle {
        font-style: italic;
        color: #000;
        font-size: 10pt;
        margin-bottom: 3px;
      }
      
      .cv-item-date {
        font-size: 10pt;
        color: #000;
        font-weight: normal;
        white-space: nowrap;
        flex-shrink: 0;
      }
      
      .cv-item-description {
        font-size: 10pt;
        line-height: 1.4;
        color: #000;
        text-align: justify;
        margin-top: 5px;
      }
      
      .cv-signature {
        text-align: center;
        margin-top: 30px;
        padding-top: 20px;
        border-top: 1px solid #000;
        page-break-inside: avoid;
      }
      
      .cv-signature img {
        max-width: 120px;
        max-height: 60px;
        margin-bottom: 15px;
      }
      
      .signature-line {
        border-top: 1px solid #000;
        width: 200px;
        margin: 20px auto 10px;
      }
      
      .cv-signature p {
        margin-bottom: 5px;
        font-weight: bold;
        font-size: 10pt;
      }
    `

    // Crear elemento de estilo
    const styleElement = document.createElement("style")
    styleElement.textContent = pdfStyles
    tempContainer.appendChild(styleElement)

    // Agregar al DOM temporalmente
    document.body.appendChild(tempContainer)

    // Generar canvas con configuración optimizada
    const { html2canvas } = window
    const canvas = await html2canvas(tempContainer, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "white",
      width: 794,
      height: Math.max(1123, tempContainer.scrollHeight),
      scrollX: 0,
      scrollY: 0,
      windowWidth: 794,
      windowHeight: Math.max(1123, tempContainer.scrollHeight),
    })

    // Remover elemento temporal
    document.body.removeChild(tempContainer)

    // Crear PDF con configuración A4 mejorada
    const { jsPDF } = window.jspdf
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    })

    const imgData = canvas.toDataURL("image/png", 0.95)
    const pdfWidth = 210 // A4 width in mm
    const pdfHeight = 297 // A4 height in mm
    const imgWidth = pdfWidth
    const imgHeight = (canvas.height * pdfWidth) / canvas.width

    // Configuración de márgenes para páginas múltiples
    const topMargin = 0 // Sin margen superior adicional
    const bottomMargin = 0 // Sin margen inferior adicional

    let heightLeft = imgHeight
    let position = 0
    let pageNumber = 1

    // Agregar primera página
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, undefined, "FAST")
    heightLeft -= pdfHeight

    // Agregar páginas adicionales si es necesario
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pageNumber++

      // Para páginas adicionales, mantener la misma estructura
      // pero ajustar la posición para que los márgenes se vean correctos
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, undefined, "FAST")
      heightLeft -= pdfHeight
    }

    // Descargar PDF con nombre optimizado
    const fileName = `CV_${(currentFormData.fullName || "Usuario").replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`
    pdf.save(fileName)

    showToast("¡Éxito!", "CV descargado correctamente con formato profesional", "success")
  } catch (error) {
    console.error("Error al generar PDF:", error)
    showToast("Error", "No se pudo generar el PDF. Inténtalo de nuevo.", "error")
  } finally {
    button.classList.remove("loading")
  }
}

// ===== DESCARGA WORD PROFESIONAL =====
async function downloadWord() {
  const button = document.getElementById("download-word")
  button.classList.add("loading")

  try {
    showToast("Generando Word", "Creando documento Word profesional...", "info")

    // Verificar si las librerías están disponibles
    if (typeof docx === "undefined") {
      throw new Error("Librería docx no disponible")
    }

    const data = currentFormData
    const {
      Document,
      Packer,
      Paragraph,
      TextRun,
      HeadingLevel,
      AlignmentType,
      BorderStyle,
      TabStopPosition,
      TabStopType,
    } = docx

    // Crear documento Word con configuración profesional
    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 720, // 0.5 pulgadas en twips (720 twips = 0.5")
                right: 720, // 0.5 pulgadas
                bottom: 720, // 0.5 pulgadas
                left: 720, // 0.5 pulgadas
              },
            },
          },
          children: [
            // ENCABEZADO CON NOMBRE
            new Paragraph({
              children: [
                new TextRun({
                  text: data.fullName.toUpperCase(),
                  bold: true,
                  size: 32, // 16pt
                  font: "Times New Roman",
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: {
                after: 240, // Espacio después
                before: 0,
              },
            }),

            // INFORMACIÓN DE CONTACTO
            new Paragraph({
              children: [
                new TextRun({
                  text: `${data.address}`,
                  size: 20, // 10pt
                  font: "Times New Roman",
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 120 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: `${data.phone} | ${data.email}`,
                  size: 20,
                  font: "Times New Roman",
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: data.linkedin || data.portfolio ? 120 : 240 },
            }),

            // LINKS PROFESIONALES (si existen)
            ...(data.linkedin || data.portfolio
              ? [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `${data.linkedin ? `LinkedIn: ${data.linkedin}` : ""}${data.linkedin && data.portfolio ? " | " : ""}${data.portfolio ? `GitHub: ${data.portfolio}` : ""}`,
                        size: 20,
                        font: "Times New Roman",
                      }),
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 240 },
                  }),
                ]
              : []),

            // LÍNEA SEPARADORA
            new Paragraph({
              children: [
                new TextRun({
                  text: "________________________________________________________________________________________________",
                  size: 20,
                  font: "Times New Roman",
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 240 },
            }),

            // PERFIL PROFESIONAL
            ...(data.professionalProfile
              ? [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: "PERFIL PROFESIONAL",
                        bold: true,
                        size: 24, // 12pt
                        font: "Times New Roman",
                      }),
                    ],
                    heading: HeadingLevel.HEADING_2,
                    spacing: { before: 240, after: 180 },
                  }),

                  new Paragraph({
                    children: [
                      new TextRun({
                        text: data.professionalProfile,
                        size: 22, // 11pt
                        font: "Times New Roman",
                      }),
                    ],
                    alignment: AlignmentType.JUSTIFIED,
                    spacing: { after: 300 },
                    indent: { left: 0, right: 0 },
                  }),
                ]
              : []),

            // FORMACIÓN ACADÉMICA
            ...(data.education.length > 0
              ? [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: "FORMACIÓN ACADÉMICA",
                        bold: true,
                        size: 24,
                        font: "Times New Roman",
                      }),
                    ],
                    heading: HeadingLevel.HEADING_2,
                    spacing: { before: 240, after: 180 },
                  }),

                  ...data.education.flatMap((edu) => [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: edu.degree || "Título no especificado",
                          bold: true,
                          size: 22,
                          font: "Times New Roman",
                        }),
                      ],
                      spacing: { after: 60 },
                    }),

                    new Paragraph({
                      children: [
                        new TextRun({
                          text: edu.institution || "Institución no especificada",
                          italics: true,
                          size: 20,
                          font: "Times New Roman",
                        }),
                      ],
                      spacing: { after: 60 },
                    }),

                    new Paragraph({
                      children: [
                        new TextRun({
                          text: `${formatDateRange(edu.startDate, edu.endDate, edu.status)} - ${formatStatus(edu.status)}`,
                          size: 20,
                          font: "Times New Roman",
                        }),
                      ],
                      spacing: { after: 180 },
                    }),
                  ]),
                ]
              : []),

            // OTROS CURSOS Y ESTUDIOS
            ...(data.courses.length > 0
              ? [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: "OTROS CURSOS Y ESTUDIOS",
                        bold: true,
                        size: 24,
                        font: "Times New Roman",
                      }),
                    ],
                    heading: HeadingLevel.HEADING_2,
                    spacing: { before: 240, after: 180 },
                  }),

                  ...data.courses.flatMap((course) => [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: course.name || "Curso no especificado",
                          bold: true,
                          size: 22,
                          font: "Times New Roman",
                        }),
                      ],
                      spacing: { after: 60 },
                    }),

                    new Paragraph({
                      children: [
                        new TextRun({
                          text: course.institution || "Institución no especificada",
                          italics: true,
                          size: 20,
                          font: "Times New Roman",
                        }),
                      ],
                      spacing: { after: 60 },
                    }),

                    new Paragraph({
                      children: [
                        new TextRun({
                          text: `${formatDateRange(course.startDate, course.endDate, course.status)} - ${formatStatus(course.status)}`,
                          size: 20,
                          font: "Times New Roman",
                        }),
                      ],
                      spacing: { after: 180 },
                    }),
                  ]),
                ]
              : []),

            // EXPERIENCIA LABORAL
            ...(data.experience.length > 0
              ? [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: "EXPERIENCIA LABORAL",
                        bold: true,
                        size: 24,
                        font: "Times New Roman",
                      }),
                    ],
                    heading: HeadingLevel.HEADING_2,
                    spacing: { before: 240, after: 180 },
                  }),

                  ...data.experience.flatMap((exp) => [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: (exp.company || "Empresa no especificada").toUpperCase(),
                          bold: true,
                          size: 22,
                          font: "Times New Roman",
                        }),
                      ],
                      spacing: { after: 60 },
                    }),

                    new Paragraph({
                      children: [
                        new TextRun({
                          text: `Cargo: ${exp.position || "Cargo no especificado"}`,
                          size: 20,
                          font: "Times New Roman",
                        }),
                      ],
                      spacing: { after: 60 },
                    }),

                    new Paragraph({
                      children: [
                        new TextRun({
                          text: `Fecha: ${formatDateRange(exp.startDate, exp.endDate)}`,
                          size: 20,
                          font: "Times New Roman",
                        }),
                      ],
                      spacing: { after: 120 },
                    }),

                    ...(exp.functions
                      ? [
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: "Funciones:",
                                bold: true,
                                size: 20,
                                font: "Times New Roman",
                              }),
                            ],
                            spacing: { after: 60 },
                          }),

                          ...exp.functions
                            .split("\n")
                            .filter((f) => f.trim())
                            .map(
                              (func) =>
                                new Paragraph({
                                  children: [
                                    new TextRun({
                                      text: func.trim().startsWith("•") ? func.trim() : `• ${func.trim()}`,
                                      size: 20,
                                      font: "Times New Roman",
                                    }),
                                  ],
                                  spacing: { after: 60 },
                                  indent: { left: 360 }, // Sangría para las viñetas
                                }),
                            ),
                        ]
                      : []),

                    new Paragraph({
                      children: [new TextRun({ text: "", size: 1 })],
                      spacing: { after: 240 },
                    }),
                  ]),
                ]
              : []),

            // LÍNEA SEPARADORA FINAL
            new Paragraph({
              children: [
                new TextRun({
                  text: "________________________________________________________________________________________________",
                  size: 20,
                  font: "Times New Roman",
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { before: 300, after: 240 },
            }),

            // FIRMA Y DATOS DE IDENTIFICACIÓN
            new Paragraph({
              children: [
                new TextRun({
                  text: data.fullName,
                  bold: true,
                  size: 20,
                  font: "Times New Roman",
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 120 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: `${formatDocType(data.docType)}: ${data.docNumber}`,
                  size: 20,
                  font: "Times New Roman",
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 120 },
            }),
          ],
        },
      ],
    })

    // Generar y descargar el archivo Word
    const blob = await Packer.toBlob(doc)
    const fileName = `CV_${(data.fullName || "Usuario").replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.docx`

    // Usar FileSaver para descargar
    if (typeof saveAs !== "undefined") {
      saveAs(blob, fileName)
      showToast("¡Éxito!", "CV descargado en formato Word con márgenes profesionales", "success")
    } else {
      throw new Error("FileSaver no disponible")
    }
  } catch (error) {
    console.error("Error al generar Word:", error)

    // Método de respaldo: crear HTML que se puede abrir en Word
    try {
      const data = currentFormData

      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>CV - ${data.fullName}</title>
    <style>
        @page {
            margin: 0.5in;
            size: letter;
        }
        body {
            font-family: 'Times New Roman', serif;
            font-size: 11pt;
            line-height: 1.4;
            color: black;
            margin: 0;
            padding: 0;
        }
        .header {
            text-align: center;
            margin-bottom: 20pt;
            border-bottom: 2px solid black;
            padding-bottom: 10pt;
        }
        .header h1 {
            font-size: 16pt;
            font-weight: bold;
            margin-bottom: 10pt;
            text-transform: uppercase;
            letter-spacing: 1pt;
        }
        .contact {
            font-size: 10pt;
            margin-bottom: 5pt;
        }
        .section {
            margin-bottom: 15pt;
        }
        .section h2 {
            font-size: 12pt;
            font-weight: bold;
            text-transform: uppercase;
            border-bottom: 1px solid black;
            padding-bottom: 3pt;
            margin-bottom: 8pt;
        }
        .item {
            margin-bottom: 10pt;
        }
        .item-title {
            font-weight: bold;
            font-size: 11pt;
        }
        .item-subtitle {
            font-style: italic;
            font-size: 10pt;
        }
        .item-date {
            font-size: 10pt;
        }
        .functions {
            margin-top: 5pt;
            font-size: 10pt;
            text-align: justify;
        }
        .signature {
            text-align: center;
            margin-top: 20pt;
            padding-top: 10pt;
            border-top: 1px solid black;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${data.fullName}</h1>
        <div class="contact">Dirección: ${data.address}</div>
        <div class="contact">Teléfono: ${data.phone} | Email: ${data.email}</div>
        ${data.linkedin || data.portfolio ? `<div class="contact">${data.linkedin ? `LinkedIn: ${data.linkedin}` : ""}${data.linkedin && data.portfolio ? " | " : ""}${data.portfolio ? `GitHub: ${data.portfolio}` : ""}</div>` : ""}
    </div>

    ${
      data.professionalProfile
        ? `
    <div class="section">
        <h2>Perfil Profesional</h2>
        <p>${data.professionalProfile}</p>
    </div>
    `
        : ""
    }

    ${
      data.education.length > 0
        ? `
    <div class="section">
        <h2>Formación Académica</h2>
        ${data.education
          .map(
            (edu) => `
        <div class="item">
            <div class="item-title">${edu.degree || "Título no especificado"}</div>
            <div class="item-subtitle">${edu.institution || "Institución no especificada"}</div>
            <div class="item-date">${formatDateRange(edu.startDate, edu.endDate, edu.status)} - ${formatStatus(edu.status)}</div>
        </div>
        `,
          )
          .join("")}
    </div>
    `
        : ""
    }

    ${
      data.courses.length > 0
        ? `
    <div class="section">
        <h2>Otros Cursos y Estudios</h2>
        ${data.courses
          .map(
            (course) => `
        <div class="item">
            <div class="item-title">${course.name || "Curso no especificado"}</div>
            <div class="item-subtitle">${course.institution || "Institución no especificada"}</div>
            <div class="item-date">${formatDateRange(course.startDate, course.endDate, course.status)} - ${formatStatus(edu.status)}</div>
        </div>
        `,
          )
          .join("")}
    </div>
    `
        : ""
    }

    ${
      data.experience.length > 0
        ? `
    <div class="section">
        <h2>Experiencia Laboral</h2>
        ${data.experience
          .map(
            (exp) => `
        <div class="item">
            <div class="item-title">${(exp.company || "Empresa no especificada").toUpperCase()}</div>
            <div class="item-subtitle">Cargo: ${exp.position || "Cargo no especificado"}</div>
            <div class="item-date">Fecha: ${formatDateRange(exp.startDate, exp.endDate)}</div>
            ${exp.functions ? `<div class="functions">Funciones:<br>${exp.functions.replace(/\n/g, "<br>")}</div>` : ""}
        </div>
        `,
          )
          .join("")}
    </div>
    `
        : ""
    }

    <div class="signature">
        <strong>${data.fullName}</strong><br>
        ${formatDocType(data.docType)}: ${data.docNumber}
    </div>
</body>
</html>`

      const blob = new Blob([htmlContent], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      })

      const link = document.createElement("a")
      link.href = URL.createObjectURL(blob)
      link.download = `CV_${(data.fullName || "Usuario").replace(/\s+/g, "_")}.doc`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      showToast("Descarga alternativa", "CV descargado como documento compatible con Word", "warning")
    } catch (fallbackError) {
      showToast("Error", "No se pudo descargar el archivo Word", "error")
    }
  } finally {
    button.classList.remove("loading")
  }
}

// ===== COMPARTIR CV =====
async function shareCV() {
  try {
    const formData = collectFormData()

    // Generar ID único para el CV
    const cvId = generateUniqueId()

    // Simular guardado en servidor (en producción sería una API real)
    const shareData = {
      id: cvId,
      data: formData,
      template: currentTemplate,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 horas
    }

    // Guardar en localStorage (simular servidor)
    localStorage.setItem(`shared-cv-${cvId}`, JSON.stringify(shareData))

    // Generar enlace
    const shareUrl = `${window.location.origin}${window.location.pathname}?shared=${cvId}`

    // Mostrar modal
    document.getElementById("share-link").value = shareUrl
    openModal("share-modal")

    showToast("CV compartido", "Enlace generado correctamente", "success")
  } catch (error) {
    console.error("Error al compartir CV:", error)
    showToast("Error", "No se pudo compartir el CV", "error")
  }
}

function copyShareLink() {
  const shareLink = document.getElementById("share-link")
  shareLink.select()
  shareLink.setSelectionRange(0, 99999)

  try {
    document.execCommand("copy")
    showToast("¡Copiado!", "Enlace copiado al portapapeles", "success")
  } catch (error) {
    showToast("Error", "No se pudo copiar el enlace", "error")
  }
}

function generateUniqueId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// ===== EXPORTAR/IMPORTAR DATOS =====
function exportData() {
  try {
    const formData = collectFormData()
    const exportData = {
      version: "2.0",
      data: formData,
      template: currentTemplate,
      exportedAt: new Date().toISOString(),
    }

    const dataStr = JSON.stringify(exportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })

    const link = document.createElement("a")
    link.href = URL.createObjectURL(dataBlob)
    link.download = `CV_Data_${new Date().toISOString().split("T")[0]}.json`
    link.click()

    showToast("Datos exportados", "Archivo JSON descargado", "success")
  } catch (error) {
    console.error("Error al exportar datos:", error)
    showToast("Error", "No se pudieron exportar los datos", "error")
  }
}

function handleFileSelect(event) {
  const file = event.target.files[0]
  const confirmButton = document.getElementById("confirm-import")

  if (file && file.type === "application/json") {
    confirmButton.disabled = false
    confirmButton.textContent = "Importar"
  } else {
    confirmButton.disabled = true
    confirmButton.textContent = "Selecciona un archivo JSON válido"
  }
}

async function importData() {
  const fileInput = document.getElementById("import-file")
  const file = fileInput.files[0]

  if (!file) {
    showToast("Error", "Selecciona un archivo", "error")
    return
  }

  try {
    const text = await file.text()
    const importedData = JSON.parse(text)

    // Validar estructura de datos
    if (!importedData.data || !importedData.version) {
      throw new Error("Formato de archivo inválido")
    }

    // Confirmar importación
    if (confirm("¿Estás seguro de que quieres importar estos datos? Se sobrescribirán los datos actuales.")) {
      // Cargar datos en el formulario
      loadDataIntoForm(importedData.data)

      // Aplicar plantilla si existe
      if (importedData.template) {
        currentTemplate = importedData.template
        document.getElementById("template-selector").value = currentTemplate
      }

      // Cerrar modal
      closeModal("import-modal")

      // Actualizar progreso
      updateProgress()

      showToast("¡Importado!", "Datos cargados correctamente", "success")
    }
  } catch (error) {
    console.error("Error al importar datos:", error)
    showToast("Error", "Archivo inválido o corrupto", "error")
  }
}

function loadDataIntoForm(data) {
  // Cargar datos básicos
  Object.keys(data).forEach((key) => {
    const element = document.getElementById(key)
    if (element && typeof data[key] === "string") {
      element.value = data[key]
    }
  })

  // Cargar datos dinámicos (educación, cursos, experiencia)
  // Esta función se puede expandir según necesidades específicas
}

// ===== MODALES =====
function openModal(modalId) {
  const modal = document.getElementById(modalId)
  modal.classList.remove("hidden")
  document.body.style.overflow = "hidden"
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId)
  modal.classList.add("hidden")
  document.body.style.overflow = ""
}

// ===== TOAST NOTIFICATIONS MEJORADAS =====
function showToast(title, message, type = "info", duration = 5000) {
  const container = document.getElementById("toast-container")

  const toast = document.createElement("div")
  toast.className = `toast ${type}`

  const icons = {
    success: "✅",
    error: "❌",
    warning: "⚠️",
    info: "ℹ️",
  }

  toast.innerHTML = `
        <div class="toast-icon">${icons[type]}</div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `

  container.appendChild(toast)

  // Auto-remover
  setTimeout(() => {
    if (toast.parentElement) {
      toast.style.animation = "slideOutRight 0.3s ease forwards"
      setTimeout(() => toast.remove(), 300)
    }
  }, duration)
}

// ===== VALIDACIÓN EN TIEMPO REAL (MEJORADA) =====
function setupRealTimeValidation() {
  const validators = {
    fullName: {
      required: true,
      minLength: 2,
      pattern: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
      message: "Ingresa un nombre válido (solo letras y espacios)",
    },
    email: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: "Ingresa un email válido",
    },
    phone: {
      required: true,
      pattern: /^[+]?[1-9][\d\s\-()]{7,15}$/,
      message: "Ingresa un teléfono válido",
    },
    address: {
      required: true,
      minLength: 10,
      message: "Ingresa una dirección completa",
    },
    docNumber: {
      required: true,
      pattern: /^[0-9]+$/,
      message: "Solo números permitidos",
    },
    linkedin: {
      pattern: /^https?:\/\/(www\.)?linkedin\.com\/in\/[\w-]+\/?$/,
      message: "URL de LinkedIn inválida",
    },
    portfolio: {
      pattern: /^https?:\/\/.+/,
      message: "URL inválida",
    },
  }

  Object.keys(validators).forEach((fieldName) => {
    const field = document.getElementById(fieldName)
    if (field) {
      field.addEventListener("blur", () => validateField(field, validators[fieldName]))
      field.addEventListener(
        "input",
        debounce(() => validateField(field, validators[fieldName]), 500),
      )
    }
  })
}

function validateField(field, rules) {
  const value = field.value.trim()
  const container = field.closest(".input-container")
  const errorElement = container.querySelector(".error-message")

  let isValid = true
  let errorMessage = ""

  // Validar campo requerido
  if (rules.required && !value) {
    isValid = false
    errorMessage = "Este campo es obligatorio"
  }
  // Validar longitud mínima
  else if (rules.minLength && value.length < rules.minLength) {
    isValid = false
    errorMessage = `Mínimo ${rules.minLength} caracteres`
  }
  // Validar patrón
  else if (rules.pattern && value && !rules.pattern.test(value)) {
    isValid = false
    errorMessage = rules.message
  }

  // Actualizar UI con animaciones
  if (isValid) {
    container.classList.remove("invalid")
    container.classList.add("valid")
    errorElement.textContent = ""

    // Animación de éxito
    field.style.animation = "none"
    setTimeout(() => {
      field.style.animation = "pulse 0.3s ease"
    }, 10)
  } else {
    container.classList.remove("valid")
    container.classList.add("invalid")
    errorElement.textContent = errorMessage

    // Animación de error
    field.style.animation = "shake 0.5s ease"
  }

  return isValid
}

// ===== CONTADORES DE CARACTERES (MEJORADOS) =====
function setupCharacterCounters() {
  // Remover la configuración del perfil profesional
  // Solo mantener los contadores para experiencia laboral

  // Contadores para experiencia laboral
  document.addEventListener("input", (e) => {
    if (e.target.name && e.target.name.includes("functions")) {
      const counter = e.target.parentNode.querySelector(".char-count")
      if (counter) {
        const currentLength = e.target.value.length
        counter.textContent = currentLength

        if (currentLength > 640) {
          counter.style.color = "var(--danger-color)"
          counter.style.animation = "pulse 1s infinite"
        } else if (currentLength > 560) {
          counter.style.color = "var(--warning-color)"
          counter.style.animation = "none"
        } else {
          counter.style.color = "var(--gray-500)"
          counter.style.animation = "none"
        }
      }
    }
  })
}

// ===== MANEJO DE FECHAS CONDICIONALES =====
function toggleEndDate(selectElement, type, index) {
  const container = selectElement.closest(".dynamic-item") || selectElement.closest(".form-group")
  const endDateInput = container.querySelector(`input[name="${type}[${index}][endDate]"]`)
  const helpText = endDateInput.nextElementSibling

  if (selectElement.value === "en-curso") {
    // Deshabilitar fecha de fin para "en curso"
    endDateInput.disabled = true
    endDateInput.value = ""
    endDateInput.style.backgroundColor = "var(--gray-100)"
    helpText.textContent = "No aplica para estudios en curso"
    helpText.style.color = "var(--gray-400)"
  } else if (selectElement.value === "completado" || selectElement.value === "aplazado") {
    // Habilitar fecha de fin para "completado" o "aplazado"
    endDateInput.disabled = false
    endDateInput.classList.add("just-enabled")
    endDateInput.style.backgroundColor = "var(--white)"
    helpText.textContent = "Fecha de finalización"
    helpText.style.color = "var(--gray-500)"

    // Remover clase de animación después de la animación
    setTimeout(() => {
      endDateInput.classList.remove("just-enabled")
    }, 300)

    // Mostrar toast informativo
    showToast("Campo habilitado", "Ahora puedes ingresar la fecha de fin", "info", 2000)
  } else {
    // Estado no seleccionado
    endDateInput.disabled = true
    endDateInput.value = ""
    endDateInput.style.backgroundColor = "var(--gray-100)"
    helpText.textContent = 'Se habilitará al seleccionar "Completado" o "Aplazado"'
    helpText.style.color = "var(--gray-400)"
  }
}

// Función global para usar en elementos dinámicos
window.toggleEndDate = toggleEndDate

// ===== PROGRESO DEL FORMULARIO (MEJORADO) =====
function updateProgress() {
  const form = document.getElementById("cv-form")
  const requiredFields = form.querySelectorAll("input[required], select[required]")
  const allFields = form.querySelectorAll("input, textarea, select")

  let completedRequired = 0
  let completedOptional = 0

  // Contar campos requeridos completados
  requiredFields.forEach((field) => {
    if (field.value.trim() !== "") {
      completedRequired++
    }
  })

  // Contar campos opcionales completados
  allFields.forEach((field) => {
    if (!field.hasAttribute("required") && field.value.trim() !== "") {
      completedOptional++
    }
  })

  // Calcular progreso (70% requeridos, 30% opcionales)
  const requiredProgress = (completedRequired / requiredFields.length) * 70
  const optionalProgress = (completedOptional / (allFields.length - requiredFields.length)) * 30
  const totalProgress = Math.round(requiredProgress + optionalProgress)

  // Actualizar UI con animaciones
  const progressFill = document.getElementById("progress-fill")
  const progressText = document.getElementById("progress-text")

  progressFill.style.width = `${totalProgress}%`
  progressText.textContent = `${totalProgress}% completado`

  // Cambiar color según progreso con transiciones suaves
  if (totalProgress >= 80) {
    progressFill.style.background = "linear-gradient(90deg, var(--success-color), #059669)"
    progressText.style.color = "var(--success-color)"
  } else if (totalProgress >= 50) {
    progressFill.style.background = "linear-gradient(90deg, var(--warning-color), #d97706)"
    progressText.style.color = "var(--warning-color)"
  } else {
    progressFill.style.background = "linear-gradient(90deg, var(--primary-color), var(--primary-light))"
    progressText.style.color = "var(--primary-color)"
  }

  // Marcar secciones completadas
  const formGroups = document.querySelectorAll(".form-group")
  formGroups.forEach((group) => {
    const inputs = group.querySelectorAll("input, textarea, select")
    const requiredInputs = group.querySelectorAll("input[required], select[required]")

    let allRequiredFilled = true
    requiredInputs.forEach((input) => {
      if (!input.value.trim()) {
        allRequiredFilled = false
      }
    })

    if (allRequiredFilled && requiredInputs.length > 0) {
      group.classList.add("completed")
    } else {
      group.classList.remove("completed")
    }
  })
}

// ===== MANEJO DE ITEMS DINÁMICOS (MEJORADO) =====
function addEducationItem() {
  const container = document.getElementById("education-container")
  const newItem = createEducationItem(educationCount)
  container.appendChild(newItem)
  educationCount++
  updateItemNumbers("education")
  updateProgress()

  // Animar entrada con efecto mejorado
  newItem.style.opacity = "0"
  newItem.style.transform = "translateY(20px) scale(0.95)"
  setTimeout(() => {
    newItem.style.transition = "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)"
    newItem.style.opacity = "1"
    newItem.style.transform = "translateY(0) scale(1)"
  }, 10)

  showToast("Elemento agregado", "Nueva formación académica agregada", "success", 2000)
}

function createEducationItem(index) {
  const div = document.createElement("div")
  div.className = "dynamic-item education-item"
  div.setAttribute("data-index", index)

  div.innerHTML = `
        <div class="item-header">
            <span class="item-number">${index + 1}</span>
            <button type="button" class="remove-item-btn" onclick="removeEducationItem(${index})">
                <span>×</span>
            </button>
        </div>
        
        <div class="input-grid">
            <div class="input-container">
                <label>Institución</label>
                <input type="text" name="education[${index}][institution]" 
                       placeholder="Ej: Universidad Nacional de Colombia">
            </div>

            <div class="input-container">
                <label>Título/Carrera</label>
                <input type="text" name="education[${index}][degree]" 
                       placeholder="Ej: Ingeniería de Sistemas">
            </div>

            <div class="input-container">
                <label>Estado</label>
                <select name="education[${index}][status]" onchange="toggleEndDate(this, 'education', ${index})">
                    <option value="">Selecciona el estado</option>
                    <option value="completado">Completado</option>
                    <option value="en-curso">En curso</option>
                    <option value="aplazado">Aplazado</option>
                </select>
            </div>

            <div class="input-container">
                <label>Fecha de Inicio</label>
                <input type="date" name="education[${index}][startDate]">
            </div>

            <div class="input-container">
                <label>Fecha de Fin</label>
                <input type="date" name="education[${index}][endDate]" disabled>
                <small class="help-text">Se habilitará al seleccionar "Completado" o "Aplazado"</small>
            </div>
        </div>
    `

  return div
}

function removeEducationItem(index) {
  const item = document.querySelector(`.education-item[data-index="${index}"]`)
  if (item) {
    item.style.transition = "all 0.3s ease"
    item.style.opacity = "0"
    item.style.transform = "translateX(-20px) scale(0.95)"
    setTimeout(() => {
      item.remove()
      updateItemNumbers("education")
      updateProgress()
    }, 300)

    showToast("Elemento eliminado", "Formación académica eliminada", "info", 2000)
  }
}

function addCourseItem() {
  const container = document.getElementById("courses-container")
  const newItem = createCourseItem(courseCount)
  container.appendChild(newItem)
  courseCount++
  updateItemNumbers("course")
  updateProgress()

  // Animar entrada
  newItem.style.opacity = "0"
  newItem.style.transform = "translateY(20px) scale(0.95)"
  setTimeout(() => {
    newItem.style.transition = "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)"
    newItem.style.opacity = "1"
    newItem.style.transform = "translateY(0) scale(1)"
  }, 10)

  showToast("Elemento agregado", "Nuevo curso agregado", "success", 2000)
}

function createCourseItem(index) {
  const div = document.createElement("div")
  div.className = "dynamic-item course-item"
  div.setAttribute("data-index", index)

  div.innerHTML = `
        <div class="item-header">
            <span class="item-number">${index + 1}</span>
            <button type="button" class="remove-item-btn" onclick="removeCourseItem(${index})">
                <span>×</span>
            </button>
        </div>
        
        <div class="input-grid">
            <div class="input-container">
                <label>Institución</label>
                <input type="text" name="courses[${index}][institution]" 
                       placeholder="Ej: Platzi, Coursera, SENA">
            </div>

            <div class="input-container">
                <label>Nombre del Curso</label>
                <input type="text" name="courses[${index}][name]" 
                       placeholder="Ej: Curso de React.js Avanzado">
            </div>

            <div class="input-container">
                <label>Estado</label>
                <select name="courses[${index}][status]" onchange="toggleEndDate(this, 'courses', ${index})">
                    <option value="">Selecciona el estado</option>
                    <option value="completado">Completado</option>
                    <option value="en-curso">En curso</option>
                    <option value="aplazado">Aplazado</option>
                </select>
            </div>

            <div class="input-container">
                <label>Fecha de Inicio</label>
                <input type="date" name="courses[${index}][startDate]">
            </div>

            <div class="input-container">
                <label>Fecha de Fin</label>
                <input type="date" name="courses[${index}][endDate]" disabled>
                <small class="help-text">Se habilitará al seleccionar "Completado" o "Aplazado"</small>
            </div>
        </div>
    `

  return div
}

function removeCourseItem(index) {
  const item = document.querySelector(`.course-item[data-index="${index}"]`)
  if (item) {
    item.style.transition = "all 0.3s ease"
    item.style.opacity = "0"
    item.style.transform = "translateX(-20px) scale(0.95)"
    setTimeout(() => {
      item.remove()
      updateItemNumbers("course")
      updateProgress()
    }, 300)

    showToast("Elemento eliminado", "Curso eliminado", "info", 2000)
  }
}

function addExperienceItem() {
  const container = document.getElementById("experience-container")
  const newItem = createExperienceItem(experienceCount)
  container.appendChild(newItem)
  experienceCount++
  updateItemNumbers("experience")
  updateProgress()

  // Animar entrada
  newItem.style.opacity = "0"
  newItem.style.transform = "translateY(20px) scale(0.95)"
  setTimeout(() => {
    newItem.style.transition = "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)"
    newItem.style.opacity = "1"
    newItem.style.transform = "translateY(0) scale(1)"
  }, 10)

  showToast("Elemento agregado", "Nueva experiencia laboral agregada", "success", 2000)
}

function createExperienceItem(index) {
  const div = document.createElement("div")
  div.className = "dynamic-item experience-item"
  div.setAttribute("data-index", index)

  div.innerHTML = `
        <div class="item-header">
            <span class="item-number">${index + 1}</span>
            <button type="button" class="remove-item-btn" onclick="removeExperienceItem(${index})">
                <span>×</span>
            </button>
        </div>
        
        <div class="input-grid">
            <div class="input-container">
                <label>Nombre de la Empresa</label>
                <input type="text" name="experience[${index}][company]" 
                       placeholder="Ej: Google Colombia">
            </div>

            <div class="input-container">
                <label>Cargo</label>
                <input type="text" name="experience[${index}][position]" 
                       placeholder="Ej: Desarrollador Frontend Senior">
            </div>

            <div class="input-container">
                <label>Fecha de Inicio</label>
                <input type="date" name="experience[${index}][startDate]">
            </div>

            <div class="input-container">
                <label>Fecha de Fin</label>
                <input type="date" name="experience[${index}][endDate]">
                <small class="help-text">Deja vacío si es tu trabajo actual</small>
            </div>

            <div class="input-container span-2">
                <label>Funciones y Logros</label>
                <textarea name="experience[${index}][functions]" rows="3" maxlength="800"
                          placeholder="Ej: • Desarrollo de aplicaciones web con React.js y Node.js&#10;• Liderazgo de equipo de 5 desarrolladores&#10;• Implementación de metodologías ágiles que mejoraron la productividad en 30%"></textarea>
                <div class="char-counter">
                    <span class="char-count">0</span>/800 caracteres
                </div>
            </div>
        </div>
    `

  return div
}

function removeExperienceItem(index) {
  const item = document.querySelector(`.experience-item[data-index="${index}"]`)
  if (item) {
    item.style.transition = "all 0.3s ease"
    item.style.opacity = "0"
    item.style.transform = "translateX(-20px) scale(0.95)"
    setTimeout(() => {
      item.remove()
      updateItemNumbers("experience")
      updateProgress()
    }, 300)

    showToast("Elemento eliminado", "Experiencia laboral eliminada", "info", 2000)
  }
}

function updateItemNumbers(type) {
  const items = document.querySelectorAll(`.${type}-item`)
  items.forEach((item, index) => {
    const numberSpan = item.querySelector(".item-number")
    if (numberSpan) {
      numberSpan.textContent = index + 1
    }

    // Mostrar/ocultar botón de eliminar
    const removeBtn = item.querySelector(".remove-item-btn")
    if (removeBtn) {
      if (items.length > 1) {
        removeBtn.classList.remove("hidden")
      } else {
        removeBtn.classList.add("hidden")
      }
    }
  })
}

// ===== MANEJO DE FIRMA (MEJORADO) =====
function handleSignatureUpload(event) {
  const file = event.target.files[0]
  const preview = document.getElementById("signature-preview")

  if (file) {
    // Validar tipo de archivo
    if (!file.type.startsWith("image/")) {
      showToast("Error", "Por favor selecciona un archivo de imagen válido", "error")
      event.target.value = ""
      return
    }

    // Validar tamaño (2MB máximo)
    if (file.size > 2 * 1024 * 1024) {
      showToast("Error", "La imagen debe ser menor a 2MB", "error")
      event.target.value = ""
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      preview.innerHTML = `
                <img src="${e.target.result}" alt="Vista previa de firma" style="animation: fadeIn 0.3s ease;">
                <button type="button" class="btn btn-secondary" onclick="removeSignature()" style="margin-top: 10px;">
                    <span>🗑️</span> Eliminar Firma
                </button>
            `

      showToast("Firma cargada", "Imagen de firma agregada correctamente", "success")
    }
    reader.readAsDataURL(file)
  } else {
    preview.innerHTML = ""
  }
}

function removeSignature() {
  document.getElementById("signature").value = ""
  document.getElementById("signature-preview").innerHTML = ""
  showToast("Firma eliminada", "Imagen de firma removida", "info")
}

// ===== MANEJO DEL FORMULARIO (MEJORADO) =====
function handleFormSubmit(event) {
  event.preventDefault()

  console.log("📝 Procesando formulario...")

  // Mostrar loading
  showLoading()

  // Simular procesamiento con mejor feedback
  setTimeout(() => {
    try {
      // Recopilar datos
      const formData = collectFormData()
      currentFormData = formData

      // Validar datos requeridos
      if (!validateRequiredData(formData)) {
        hideLoading()
        return
      }

      // Generar CV
      const cvHTML = generateCVHTML(formData)

      // Mostrar CV
      displayCV(cvHTML)

      // Guardar datos
      saveFormData(formData)

      hideLoading()
      showToast("¡Éxito!", "CV generado exitosamente", "success")
    } catch (error) {
      console.error("❌ Error al generar CV:", error)
      hideLoading()
      showToast("Error", "Error al generar el CV. Inténtalo de nuevo.", "error")
    }
  }, 1500)
}

function collectFormData() {
  const form = document.getElementById("cv-form")
  const formData = new FormData(form)

  const data = {
    // Datos básicos
    fullName: formData.get("fullName") || "",
    address: formData.get("address") || "",
    phone: formData.get("phone") || "",
    email: formData.get("email") || "",
    linkedin: formData.get("linkedin") || "",
    portfolio: formData.get("portfolio") || "",

    // Perfil profesional
    professionalProfile: formData.get("professionalProfile") || "",

    // Formación académica
    education: collectDynamicData("education"),

    // Cursos
    courses: collectDynamicData("courses"),

    // Experiencia
    experience: collectDynamicData("experience"),

    // Firma
    signature: getSignatureData(),

    // Identificación
    docType: formData.get("docType") || "",
    docNumber: formData.get("docNumber") || "",
  }

  return data
}

function collectDynamicData(type) {
  const items = []
  const containers = document.querySelectorAll(`.${type}-item`)

  containers.forEach((container, index) => {
    const inputs = container.querySelectorAll("input, textarea,select")
    const item = {}

    inputs.forEach((input) => {
      const name = input.name
      if (name) {
        const key = name.match(/\[([^\]]+)\]$/)?.[1]
        if (key) {
          item[key] = input.value.trim()
        }
      }
    })

    // Solo agregar si tiene datos relevantes
    if (type === "education" && (item.institution || item.degree)) {
      items.push(item)
    } else if (type === "courses" && (item.institution || item.name)) {
      items.push(item)
    } else if (type === "experience" && (item.company || item.position)) {
      items.push(item)
    }
  })

  // Ordenar por fecha (más reciente primero)
  return items.sort((a, b) => {
    const dateA = new Date(a.startDate || "1900-01-01")
    const dateB = new Date(b.startDate || "1900-01-01")
    return dateB - dateA
  })
}

function getSignatureData() {
  const preview = document.getElementById("signature-preview")
  const img = preview.querySelector("img")
  return img ? img.src : null
}

function validateRequiredData(data) {
  const requiredFields = [
    { field: "fullName", name: "Nombre completo" },
    { field: "address", name: "Dirección" },
    { field: "phone", name: "Teléfono" },
    { field: "email", name: "Email" },
    { field: "docType", name: "Tipo de documento" },
    { field: "docNumber", name: "Número de documento" },
  ]

  const missingFields = []

  requiredFields.forEach(({ field, name }) => {
    if (!data[field] || data[field].trim() === "") {
      missingFields.push(name)
    }
  })

  if (missingFields.length > 0) {
    showToast("Campos faltantes", `Faltan campos obligatorios: ${missingFields.join(", ")}`, "error")
    return false
  }

  return true
}

// ===== GENERACIÓN DEL CV (MEJORADA) =====
function generateCVHTML(data) {
  let html = `
        <div class="cv-header">
            <h1>${data.fullName}</h1>
            <div class="cv-contact">
                <p><strong>Dirección:</strong> ${data.address}</p>
                <p><strong>Teléfono:</strong> ${data.phone} | <strong>Email:</strong> ${data.email}</p>
    `

  // Agregar links si existen
  if (data.linkedin || data.portfolio) {
    html += "<p>"
    if (data.linkedin) {
      html += `<strong>LinkedIn:</strong> ${data.linkedin}`
    }
    if (data.linkedin && data.portfolio) {
      html += " | "
    }
    if (data.portfolio) {
      html += `<strong>Portafolio:</strong> ${data.portfolio}`
    }
    html += "</p>"
  }

  html += `
            </div>
        </div>
    `

  // Perfil profesional
  if (data.professionalProfile) {
    html += `
            <div class="cv-section">
                <h2>Perfil Profesional</h2>
                <p class="cv-item-description">${data.professionalProfile}</p>
            </div>
        `
  }

  // Formación académica
  if (data.education.length > 0) {
    html += `
            <div class="cv-section">
                <h2>Formación Académica</h2>
        `

    data.education.forEach((edu) => {
      html += `
                <div class="cv-item">
                    <div class="cv-item-header">
                        <div>
                            <div class="cv-item-title">${edu.degree || "Título no especificado"}</div>
                            <div class="cv-item-subtitle">${edu.institution || "Institución no especificada"}</div>
                        </div>
                        <div class="cv-item-date">
                            ${formatDateRange(edu.startDate, edu.endDate, edu.status)} - ${formatStatus(edu.status)}
                        </div>
                    </div>
                </div>
            `
    })

    html += "</div>"
  }

  // Otros cursos
  if (data.courses.length > 0) {
    html += `
            <div class="cv-section">
                <h2>Otros Cursos y Estudios</h2>
        `

    data.courses.forEach((course) => {
      html += `
                <div class="cv-item">
                    <div class="cv-item-header">
                        <div>
                            <div class="cv-item-title">${course.name || "Curso no especificado"}</div>
                            <div class="cv-item-subtitle">${course.institution || "Institución no especificada"}</div>
                        </div>
                        <div class="cv-item-date">
                            ${formatDateRange(course.startDate, course.endDate, course.status)} - ${formatStatus(course.status)}
                        </div>
                    </div>
                </div>
            `
    })

    html += "</div>"
  }

  // Experiencia laboral
  if (data.experience.length > 0) {
    html += `
            <div class="cv-section">
                <h2>Experiencia Laboral</h2>
        `

    data.experience.forEach((exp) => {
      html += `
                <div class="cv-item">
                    <div class="cv-item-header">
                        <div>
                            <div class="cv-item-title">${exp.position || "Cargo no especificado"}</div>
                            <div class="cv-item-subtitle">${exp.company || "Empresa no especificada"}</div>
                        </div>
                        <div class="cv-item-date">
                            ${formatDateRange(exp.startDate, exp.endDate)}
                        </div>
                    </div>
                    ${exp.functions ? `<div class="cv-item-description">${formatFunctions(exp.functions)}</div>` : ""}
                </div>
            `
    })

    html += "</div>"
  }

  // Firma y datos de identificación
  html += `
        <div class="cv-signature">
    `

  if (data.signature) {
    html += `<img src="${data.signature}" alt="Firma">`
  }

  html += `
            <div class="signature-line"></div>
            <p><strong>${data.fullName}</strong></p>
            <p>${formatDocType(data.docType)}: ${data.docNumber}</p>
        </div>
    `

  return html
}

// ===== FUNCIONES DE FORMATO =====
function formatDateRange(startDate, endDate, status) {
  const start = startDate ? formatDate(startDate) : ""

  // Si está en curso, no mostrar fecha de fin
  if (status === "en-curso") {
    return start ? `${start} - Presente` : "En curso"
  }

  const end = endDate ? formatDate(endDate) : ""

  if (start && end) {
    return `${start} - ${end}`
  } else if (start) {
    return start
  } else {
    return "Fecha no especificada"
  }
}

function formatDate(dateString) {
  if (!dateString) return ""

  const date = new Date(dateString)
  const months = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ]

  return `${months[date.getMonth()]} ${date.getFullYear()}`
}

function formatStatus(status) {
  const statusMap = {
    completado: "Completado",
    "en-curso": "En curso",
    aplazado: "Aplazado",
  }

  return statusMap[status] || status
}

function formatDocType(docType) {
  const docTypeMap = {
    CC: "Cédula de Ciudadanía",
    CE: "Cédula de Extranjería",
    TI: "Tarjeta de Identidad",
    PP: "Pasaporte",
  }

  return docTypeMap[docType] || docType
}

function formatFunctions(functions) {
  // Convertir saltos de línea en elementos de lista si no están formateados
  if (functions.includes("•") || functions.includes("-")) {
    return functions.replace(/\n/g, "<br>")
  } else {
    // Si no tiene viñetas, agregar formato de párrafo
    return functions.replace(/\n/g, "<br>")
  }
}

// ===== MOSTRAR/OCULTAR CV (MEJORADO) =====
function displayCV(cvHTML) {
  const cvContent = document.getElementById("cv-content")
  const formSection = document.getElementById("form-section")
  const cvPreview = document.getElementById("cv-preview")

  // Aplicar plantilla seleccionada
  cvContent.className = `cv-content template-${currentTemplate}`
  cvContent.innerHTML = cvHTML

  formSection.classList.add("hidden")
  cvPreview.classList.remove("hidden")

  // Scroll suave al CV con offset
  setTimeout(() => {
    cvPreview.scrollIntoView({ behavior: "smooth", block: "start" })
  }, 100)
}

function editCV() {
  const formSection = document.getElementById("form-section")
  const cvPreview = document.getElementById("cv-preview")

  formSection.classList.remove("hidden")
  cvPreview.classList.add("hidden")

  // Scroll suave al formulario
  setTimeout(() => {
    formSection.scrollIntoView({ behavior: "smooth", block: "start" })
  }, 100)

  showToast("Modo edición", "Puedes modificar tu CV", "info")
}

// ===== FUNCIONES DE ACCIÓN (MEJORADAS) =====
function printCV() {
  // Crear una ventana nueva solo con el contenido del CV
  const cvContent = document.getElementById("cv-content")
  const printWindow = window.open("", "_blank")

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>CV - ${currentFormData.fullName || "Usuario"}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Times New Roman', serif;
          font-size: 11pt;
          line-height: 1.4;
          color: #000;
          background: white;
          padding: 0;
          margin: 0;
        }
        
        .cv-content {
          max-width: none;
          margin: 0;
          padding: 0;
          background: white;
        }
        
        .cv-header {
          text-align: center;
          margin-bottom: 20pt;
          padding-bottom: 10pt;
          border-bottom: 2px solid #000;
        }
        
        .cv-header h1 {
          font-size: 18pt;
          font-weight: bold;
          margin-bottom: 10pt;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #000;
        }
        
        .cv-contact {
          font-size: 10pt;
          margin-bottom: 8pt;
          color: #000;
        }
        
        .cv-contact p {
          margin-bottom: 5pt;
        }
        
        .cv-section {
          margin-bottom: 15pt;
          page-break-inside: avoid;
        }
        
        .cv-section h2 {
          font-size: 14pt;
          font-weight: bold;
          text-transform: uppercase;
          border-bottom: 1px solid #000;
          padding-bottom: 3pt;
          margin-bottom: 8pt;
          letter-spacing: 0.5px;
          color: #000;
        }
        
        .cv-item {
          margin-bottom: 10pt;
          page-break-inside: avoid;
        }
        
        .cv-item-header {
          margin-bottom: 5pt;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 10pt;
        }
        
        .cv-item-title {
          font-weight: bold;
          font-size: 12pt;
          color: #000;
        }
        
        .cv-item-subtitle {
          font-style: italic;
          color: #000;
          font-size: 11pt;
        }
        
        .cv-item-date {
          font-size: 10pt;
          color: #000;
          white-space: nowrap;
        }
        
        .cv-item-description {
          margin-top: 5pt;
          font-size: 11pt;
          line-height: 1.3;
          color: #000;
          text-align: justify;
        }
        
        .cv-signature {
          text-align: center;
          margin-top: 20pt;
          padding-top: 10pt;
          border-top: 1px solid #000;
          page-break-inside: avoid;
        }
        
        .cv-signature img {
          max-width: 120px;
          max-height: 60px;
          margin-bottom: 15pt;
        }
        
        .signature-line {
          border-top: 1px solid #000;
          width: 200px;
          margin: 15pt auto 8pt;
        }
        
        .cv-signature p {
          margin-bottom: 5pt;
          font-weight: bold;
          font-size: 10pt;
        }
        
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          
          .cv-content {
            margin: 0;
            padding: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="cv-content">
        ${cvContent.innerHTML}
      </div>
    </body>
    </html>
  `)

  printWindow.document.close()

  // Esperar a que se cargue el contenido y luego imprimir
  printWindow.onload = () => {
    printWindow.focus()
    printWindow.print()
    printWindow.close()
  }

  showToast("Impresión", "Ventana de impresión abierta", "success")
}

function clearForm() {
  if (confirm("¿Estás seguro de que quieres limpiar todo el formulario? Esta acción no se puede deshacer.")) {
    // Limpiar formulario
    document.getElementById("cv-form").reset()

    // Limpiar preview de firma
    document.getElementById("signature-preview").innerHTML = ""

    // Resetear items dinámicos
    resetDynamicItems()

    // Limpiar validaciones
    clearValidationStates()

    // Ocultar CV si está visible
    const formSection = document.getElementById("form-section")
    const cvPreview = document.getElementById("cv-preview")

    formSection.classList.remove("hidden")
    cvPreview.classList.add("hidden")

    // Actualizar progreso
    updateProgress()

    // Limpiar datos guardados
    localStorage.removeItem("cvFormData")

    showToast("Formulario limpiado", "Todos los datos han sido eliminados", "success")
  }
}

function resetDynamicItems() {
  // Resetear educación
  const educationContainer = document.getElementById("education-container")
  const educationItems = educationContainer.querySelectorAll(".education-item")
  for (let i = 1; i < educationItems.length; i++) {
    educationItems[i].remove()
  }

  // Resetear cursos
  const coursesContainer = document.getElementById("courses-container")
  const courseItems = coursesContainer.querySelectorAll(".course-item")
  for (let i = 1; i < courseItems.length; i++) {
    courseItems[i].remove()
  }

  // Resetear experiencia
  const experienceContainer = document.getElementById("experience-container")
  const experienceItems = experienceContainer.querySelectorAll(".experience-item")
  for (let i = 1; i < experienceItems.length; i++) {
    experienceItems[i].remove()
  }

  // Resetear contadores
  educationCount = 1
  courseCount = 1
  experienceCount = 1

  // Actualizar números
  updateItemNumbers("education")
  updateItemNumbers("course")
  updateItemNumbers("experience")
}

function clearValidationStates() {
  const containers = document.querySelectorAll(".input-container")
  containers.forEach((container) => {
    container.classList.remove("valid", "invalid")
    const errorElement = container.querySelector(".error-message")
    if (errorElement) {
      errorElement.textContent = ""
    }
  })
}

// ===== GUARDADO Y CARGA DE DATOS (MEJORADO) =====
function saveFormData(data) {
  try {
    const saveData = {
      version: "2.0",
      data: data,
      template: currentTemplate,
      savedAt: new Date().toISOString(),
    }

    localStorage.setItem("cvFormData", JSON.stringify(saveData))
    console.log("✅ Datos guardados en localStorage")
  } catch (error) {
    console.error("❌ Error al guardar datos:", error)
    showToast("Error", "No se pudieron guardar los datos", "error")
  }
}

function loadSavedData() {
  try {
    const savedData = localStorage.getItem("cvFormData")
    if (savedData) {
      const data = JSON.parse(savedData)
      console.log("📂 Datos guardados encontrados")

      // Cargar plantilla si existe
      if (data.template) {
        currentTemplate = data.template
        document.getElementById("template-selector").value = currentTemplate
      }

      showToast("Datos cargados", "Se encontraron datos guardados anteriormente", "info", 3000)
    }
  } catch (error) {
    console.error("❌ Error al cargar datos guardados:", error)
  }
}

// ===== UTILIDADES (MEJORADAS) =====
function showLoading() {
  document.getElementById("loading-overlay").classList.remove("hidden")
}

function hideLoading() {
  document.getElementById("loading-overlay").classList.add("hidden")
}

function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// ===== MANEJO DE ERRORES GLOBALES =====
window.addEventListener("error", (event) => {
  console.error("❌ Error global:", event.error)
  showToast("Error", "Ha ocurrido un error inesperado", "error")
})

window.addEventListener("unhandledrejection", (event) => {
  console.error("❌ Promise rechazada:", event.reason)
  showToast("Error", "Error en la aplicación", "error")
})

// ===== INICIALIZACIÓN DE CV COMPARTIDO =====
window.addEventListener("load", () => {
  // Verificar si hay un CV compartido en la URL
  const urlParams = new URLSearchParams(window.location.search)
  const sharedId = urlParams.get("shared")

  if (sharedId) {
    loadSharedCV(sharedId)
  }
})

function loadSharedCV(cvId) {
  try {
    const sharedData = localStorage.getItem(`shared-cv-${cvId}`)
    if (sharedData) {
      const data = JSON.parse(sharedData)

      // Verificar si no ha expirado
      if (new Date(data.expiresAt) > new Date()) {
        // Cargar datos
        loadDataIntoForm(data.data)

        // Aplicar plantilla
        currentTemplate = data.template || "classic"
        document.getElementById("template-selector").value = currentTemplate

        showToast("CV compartido cargado", "Los datos del CV compartido han sido cargados", "success")
      } else {
        showToast("Enlace expirado", "Este enlace de CV compartido ha expirado", "warning")
      }
    } else {
      showToast("CV no encontrado", "No se pudo encontrar el CV compartido", "error")
    }
  } catch (error) {
    console.error("Error al cargar CV compartido:", error)
    showToast("Error", "Error al cargar el CV compartido", "error")
  }
}

console.log("🎉 Script cargado correctamente - Generador de CV ATS v2.0 con descarga Word y impresión mejorada")
