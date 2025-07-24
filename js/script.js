// Variables globales
let educationCount = 1
let courseCount = 1
let experienceCount = 1

// Inicialización cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
  initializeApp()
})

function initializeApp() {
  // Event listeners para botones de agregar
  document.getElementById("add-education").addEventListener("click", addEducationItem)
  document.getElementById("add-course").addEventListener("click", addCourseItem)
  document.getElementById("add-experience").addEventListener("click", addExperienceItem)

  // Event listener para el formulario
  document.getElementById("cv-form").addEventListener("submit", generateCV)

  // Event listener para limpiar formulario
  document.getElementById("clear-form").addEventListener("click", clearForm)

  // Event listener para preview de firma
  document.getElementById("signature").addEventListener("change", previewSignature)

  // Event listeners para acciones del CV
  document.getElementById("edit-cv").addEventListener("click", editCV)
  document.getElementById("download-cv").addEventListener("click", downloadCV)
  document.getElementById("print-cv").addEventListener("click", printCV)

  // Agregar event listeners para remover items iniciales
  addRemoveButtonListeners()
}

// Función para agregar item de educación
function addEducationItem() {
  educationCount++
  const container = document.getElementById("education-container")
  const newItem = document.createElement("div")
  newItem.className = "education-item"
  newItem.innerHTML = `
        <button type="button" class="remove-btn" onclick="removeItem(this)">×</button>
        <div class="input-row">
            <input type="text" class="institution" placeholder="Institución">
            <input type="text" class="degree" placeholder="Título/Carrera">
        </div>
        <div class="input-row">
            <input type="date" class="start-date" placeholder="Fecha inicio">
            <input type="date" class="end-date" placeholder="Fecha fin">
            <select class="status">
                <option value="completado">Completado</option>
                <option value="en-curso">En curso</option>
                <option value="aplazado">Aplazado</option>
            </select>
        </div>
    `
  container.appendChild(newItem)
}

// Función para agregar item de curso
function addCourseItem() {
  courseCount++
  const container = document.getElementById("courses-container")
  const newItem = document.createElement("div")
  newItem.className = "course-item"
  newItem.innerHTML = `
        <button type="button" class="remove-btn" onclick="removeItem(this)">×</button>
        <div class="input-row">
            <input type="text" class="course-institution" placeholder="Institución">
            <input type="text" class="course-name" placeholder="Nombre del curso">
        </div>
        <div class="input-row">
            <input type="date" class="course-start-date" placeholder="Fecha inicio">
            <input type="date" class="course-end-date" placeholder="Fecha fin">
            <select class="course-status">
                <option value="completado">Completado</option>
                <option value="en-curso">En curso</option>
                <option value="aplazado">Aplazado</option>
            </select>
        </div>
    `
  container.appendChild(newItem)
}

// Función para agregar item de experiencia
function addExperienceItem() {
  experienceCount++
  const container = document.getElementById("experience-container")
  const newItem = document.createElement("div")
  newItem.className = "experience-item"
  newItem.innerHTML = `
        <button type="button" class="remove-btn" onclick="removeItem(this)">×</button>
        <div class="input-row">
            <input type="text" class="company" placeholder="Nombre de la empresa">
            <input type="text" class="position" placeholder="Cargo">
        </div>
        <div class="input-row">
            <input type="date" class="exp-start-date" placeholder="Fecha inicio">
            <input type="date" class="exp-end-date" placeholder="Fecha fin">
        </div>
        <textarea class="functions" placeholder="Funciones y logros principales..." rows="3"></textarea>
    `
  container.appendChild(newItem)
}

// Función para remover items
function removeItem(button) {
  const item = button.parentElement
  item.remove()
}

// Función para agregar event listeners a botones de remover
function addRemoveButtonListeners() {
  // Esta función se puede expandir si necesitamos más funcionalidad
}

// Función para preview de firma
function previewSignature() {
  const file = this.files[0]
  const preview = document.getElementById("signature-preview")

  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      preview.innerHTML = `<img src="${e.target.result}" alt="Vista previa de firma">`
    }
    reader.readAsDataURL(file)
  } else {
    preview.innerHTML = ""
  }
}

// Función principal para generar CV
function generateCV(e) {
  e.preventDefault()

  // Mostrar loading
  const form = document.getElementById("cv-form")
  form.classList.add("loading")

  setTimeout(() => {
    // Recopilar datos del formulario
    const cvData = collectFormData()

    // Validar datos requeridos
    if (!validateRequiredFields(cvData)) {
      form.classList.remove("loading")
      return
    }

    // Generar HTML del CV
    const cvHTML = generateCVHTML(cvData)

    // Mostrar el CV
    displayCV(cvHTML)

    // Remover loading
    form.classList.remove("loading")
  }, 1000)
}

// Función para recopilar datos del formulario
function collectFormData() {
  const data = {
    // Datos básicos
    fullName: document.getElementById("fullName").value,
    address: document.getElementById("address").value,
    phone: document.getElementById("phone").value,
    email: document.getElementById("email").value,
    linkedin: document.getElementById("linkedin").value,
    portfolio: document.getElementById("portfolio").value,

    // Perfil profesional
    professionalProfile: document.getElementById("professionalProfile").value,

    // Formación académica
    education: collectEducationData(),

    // Cursos
    courses: collectCoursesData(),

    // Experiencia laboral
    experience: collectExperienceData(),

    // Firma
    signature: getSignatureData(),

    // Datos de identificación
    docType: document.getElementById("docType").value,
    docNumber: document.getElementById("docNumber").value,
  }

  return data
}

// Función para recopilar datos de educación
function collectEducationData() {
  const educationItems = document.querySelectorAll(".education-item")
  const education = []

  educationItems.forEach((item) => {
    const institution = item.querySelector(".institution").value
    const degree = item.querySelector(".degree").value
    const startDate = item.querySelector(".start-date").value
    const endDate = item.querySelector(".end-date").value
    const status = item.querySelector(".status").value

    if (institution || degree) {
      education.push({
        institution,
        degree,
        startDate,
        endDate,
        status,
      })
    }
  })

  // Ordenar por fecha (más reciente primero)
  return education.sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
}

// Función para recopilar datos de cursos
function collectCoursesData() {
  const courseItems = document.querySelectorAll(".course-item")
  const courses = []

  courseItems.forEach((item) => {
    const institution = item.querySelector(".course-institution").value
    const name = item.querySelector(".course-name").value
    const startDate = item.querySelector(".course-start-date").value
    const endDate = item.querySelector(".course-end-date").value
    const status = item.querySelector(".course-status").value

    if (institution || name) {
      courses.push({
        institution,
        name,
        startDate,
        endDate,
        status,
      })
    }
  })

  // Ordenar por fecha (más reciente primero)
  return courses.sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
}

// Función para recopilar datos de experiencia
function collectExperienceData() {
  const experienceItems = document.querySelectorAll(".experience-item")
  const experience = []

  experienceItems.forEach((item) => {
    const company = item.querySelector(".company").value
    const position = item.querySelector(".position").value
    const startDate = item.querySelector(".exp-start-date").value
    const endDate = item.querySelector(".exp-end-date").value
    const functions = item.querySelector(".functions").value

    if (company || position) {
      experience.push({
        company,
        position,
        startDate,
        endDate,
        functions,
      })
    }
  })

  // Ordenar por fecha (más reciente primero)
  return experience.sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
}

// Función para obtener datos de firma
function getSignatureData() {
  const preview = document.getElementById("signature-preview")
  const img = preview.querySelector("img")
  return img ? img.src : null
}

// Función para validar campos requeridos
function validateRequiredFields(data) {
  const requiredFields = ["fullName", "address", "phone", "email", "docType", "docNumber"]
  const missingFields = []

  requiredFields.forEach((field) => {
    if (!data[field] || data[field].trim() === "") {
      missingFields.push(field)
    }
  })

  if (missingFields.length > 0) {
    alert("Por favor, completa todos los campos obligatorios marcados con *")
    return false
  }

  return true
}

// Función para generar HTML del CV
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
                            <div class="cv-item-title">${edu.degree}</div>
                            <div class="cv-item-subtitle">${edu.institution}</div>
                        </div>
                        <div class="cv-item-date">
                            ${formatDateRange(edu.startDate, edu.endDate)} - ${formatStatus(edu.status)}
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
                            <div class="cv-item-title">${course.name}</div>
                            <div class="cv-item-subtitle">${course.institution}</div>
                        </div>
                        <div class="cv-item-date">
                            ${formatDateRange(course.startDate, course.endDate)} - ${formatStatus(course.status)}
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
                            <div class="cv-item-title">${exp.position}</div>
                            <div class="cv-item-subtitle">${exp.company}</div>
                        </div>
                        <div class="cv-item-date">
                            ${formatDateRange(exp.startDate, exp.endDate)}
                        </div>
                    </div>
                    ${exp.functions ? `<div class="cv-item-description">${exp.functions}</div>` : ""}
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

// Función para formatear rango de fechas
function formatDateRange(startDate, endDate) {
  const start = startDate ? formatDate(startDate) : ""
  const end = endDate ? formatDate(endDate) : "Presente"

  if (start && end) {
    return `${start} - ${end}`
  } else if (start) {
    return start
  } else {
    return "Fecha no especificada"
  }
}

// Función para formatear fecha
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

// Función para formatear estado
function formatStatus(status) {
  const statusMap = {
    completado: "Completado",
    "en-curso": "En curso",
    aplazado: "Aplazado",
  }

  return statusMap[status] || status
}

// Función para formatear tipo de documento
function formatDocType(docType) {
  const docTypeMap = {
    CC: "Cédula de Ciudadanía",
    CE: "Cédula de Extranjería",
    TI: "Tarjeta de Identidad",
    PP: "Pasaporte",
  }

  return docTypeMap[docType] || docType
}

// Función para mostrar el CV
function displayCV(cvHTML) {
  const cvContent = document.getElementById("cv-content")
  const formSection = document.getElementById("form-section")
  const cvPreview = document.getElementById("cv-preview")

  cvContent.innerHTML = cvHTML
  formSection.classList.add("hidden")
  cvPreview.classList.remove("hidden")

  // Scroll al CV
  cvPreview.scrollIntoView({ behavior: "smooth" })
}

// Función para editar CV
function editCV() {
  const formSection = document.getElementById("form-section")
  const cvPreview = document.getElementById("cv-preview")

  formSection.classList.remove("hidden")
  cvPreview.classList.add("hidden")

  // Scroll al formulario
  formSection.scrollIntoView({ behavior: "smooth" })
}

// Función para descargar CV como PDF
function downloadCV() {
  // Esta funcionalidad requiere una librería externa como jsPDF
  // Por ahora, mostraremos un mensaje
  alert("Funcionalidad de descarga en desarrollo. Por ahora puedes usar la opción de imprimir y guardar como PDF.")
}

// Función para imprimir CV
function printCV() {
  window.print()
}

// Función para limpiar formulario
function clearForm() {
  if (confirm("¿Estás seguro de que quieres limpiar todo el formulario?")) {
    document.getElementById("cv-form").reset()

    // Limpiar preview de firma
    document.getElementById("signature-preview").innerHTML = ""

    // Resetear contadores y remover items adicionales
    resetDynamicItems()

    // Ocultar CV si está visible
    const formSection = document.getElementById("form-section")
    const cvPreview = document.getElementById("cv-preview")

    formSection.classList.remove("hidden")
    cvPreview.classList.add("hidden")
  }
}

// Función para resetear items dinámicos
function resetDynamicItems() {
  // Remover todos los items adicionales de educación
  const educationContainer = document.getElementById("education-container")
  const educationItems = educationContainer.querySelectorAll(".education-item")
  for (let i = 1; i < educationItems.length; i++) {
    educationItems[i].remove()
  }

  // Remover todos los items adicionales de cursos
  const coursesContainer = document.getElementById("courses-container")
  const courseItems = coursesContainer.querySelectorAll(".course-item")
  for (let i = 1; i < courseItems.length; i++) {
    courseItems[i].remove()
  }

  // Remover todos los items adicionales de experiencia
  const experienceContainer = document.getElementById("experience-container")
  const experienceItems = experienceContainer.querySelectorAll(".experience-item")
  for (let i = 1; i < experienceItems.length; i++) {
    experienceItems[i].remove()
  }

  // Resetear contadores
  educationCount = 1
  courseCount = 1
  experienceCount = 1
}

// Función para validar email
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Función para validar teléfono
function validatePhone(phone) {
  const phoneRegex = /^[+]?[1-9][\d]{0,15}$/
  return phoneRegex.test(phone.replace(/\s/g, ""))
}

// Agregar validación en tiempo real
document.addEventListener("DOMContentLoaded", () => {
  // Validación de email
  const emailInput = document.getElementById("email")
  emailInput.addEventListener("blur", function () {
    if (this.value && !validateEmail(this.value)) {
      this.style.borderColor = "var(--danger-color)"
      showError(this, "Por favor, ingresa un email válido")
    } else {
      this.style.borderColor = "var(--success-color)"
      hideError(this)
    }
  })

  // Validación de teléfono
  const phoneInput = document.getElementById("phone")
  phoneInput.addEventListener("blur", function () {
    if (this.value && !validatePhone(this.value)) {
      this.style.borderColor = "var(--danger-color)"
      showError(this, "Por favor, ingresa un teléfono válido")
    } else {
      this.style.borderColor = "var(--success-color)"
      hideError(this)
    }
  })
})

// Función para mostrar error
function showError(input, message) {
  hideError(input) // Remover error anterior

  const errorDiv = document.createElement("div")
  errorDiv.className = "error-message"
  errorDiv.textContent = message

  input.parentNode.insertBefore(errorDiv, input.nextSibling)
}

// Función para ocultar error
function hideError(input) {
  const errorMessage = input.parentNode.querySelector(".error-message")
  if (errorMessage) {
    errorMessage.remove()
  }
}

// Función para guardar datos en localStorage (opcional)
function saveFormData() {
  const formData = collectFormData()
  localStorage.setItem("cvFormData", JSON.stringify(formData))
}

// Función para cargar datos desde localStorage (opcional)
function loadFormData() {
  const savedData = localStorage.getItem("cvFormData")
  if (savedData) {
    const data = JSON.parse(savedData)
    // Implementar lógica para llenar el formulario con los datos guardados
  }
}
