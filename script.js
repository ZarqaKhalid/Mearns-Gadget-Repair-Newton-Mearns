document.addEventListener('DOMContentLoaded', function () {

  // ==========================================
  // 1. MOBILE NAVIGATION & DROPDOWN TOGGLE
  // ==========================================
  const mobileToggle = document.getElementById('mobileToggle');
  const navMenu = document.getElementById('navMenu');

  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', function (e) {
      e.stopPropagation();
      navMenu.classList.toggle('active');
      
      const icon = mobileToggle.querySelector('i');
      if (navMenu.classList.contains('active')) {
        icon.classList.remove('fa-bars');
        icon.classList.add('fa-xmark');
      } else {
        icon.classList.remove('fa-xmark');
        icon.classList.add('fa-bars');
      }
    });

    // Close menu when clicking a normal link
    navMenu.querySelectorAll('a.nav-link:not(.nav-dropdown > .nav-link)').forEach(link => {
      link.addEventListener('click', () => {
        if (navMenu.classList.contains('active')) {
          navMenu.classList.remove('active');
          mobileToggle.querySelector('i').classList.remove('fa-xmark');
          mobileToggle.querySelector('i').classList.add('fa-bars');
        }
      });
    });

    // Handle dropdown inside mobile menu
    document.querySelectorAll('.nav-dropdown > .nav-link').forEach(dropdownLink => {
      dropdownLink.addEventListener('click', function(e) {
        if (window.innerWidth <= 992) {
          e.preventDefault();
          this.parentElement.classList.toggle('active');
        }
      });
    });

    // Close menu when clicking outside
    document.addEventListener('click', function (e) {
      if (navMenu.classList.contains('active')) {
        if (!navMenu.contains(e.target) && !mobileToggle.contains(e.target)) {
          navMenu.classList.remove('active');
          mobileToggle.querySelector('i').classList.remove('fa-xmark');
          mobileToggle.querySelector('i').classList.add('fa-bars');
        }
      }
    });
  }

  // ==========================================
  // 2. TABS EXPLORER (FOR INDEX PAGE)
  // ==========================================
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-content-panel');

  if (tabBtns.length > 0) {
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        
        // Remove active from all buttons and panels
        tabBtns.forEach(b => b.classList.remove('active'));
        tabPanels.forEach(p => p.classList.remove('active'));
        
        // Add active to the clicked button and corresponding panel
        btn.classList.add('active');
        const targetPanel = document.getElementById('tab-' + tab);
        if (targetPanel) {
          targetPanel.classList.add('active');
        }
      });
    });
  }

  // ==========================================
  // 3. FORM SUBMISSION & MODAL CONTROL
  // Admin Data Bridge - saves to localStorage
  // ==========================================
  const bookingForms = document.querySelectorAll('.repair-booking-form');
  const confirmationModal = document.getElementById('confirmationModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalRefNumber = document.getElementById('modalRefNumber');

  // ---- Helper: save to localStorage ----
  function lsSaveBooking(data) {
    const bookings = JSON.parse(localStorage.getItem('mgr_bookings') || '[]');
    const id = 'MGR-' + Math.floor(1000 + Math.random() * 9000);
    bookings.unshift({ id, ...data, status: 'Pending', source: 'Online', createdAt: new Date().toISOString() });
    localStorage.setItem('mgr_bookings', JSON.stringify(bookings));
    return id;
  }

  function lsSaveContact(data) {
    const contacts = JSON.parse(localStorage.getItem('mgr_contacts') || '[]');
    const id = 'MSG-' + Math.floor(1000 + Math.random() * 9000);
    contacts.unshift({ id, ...data, status: 'Unread', createdAt: new Date().toISOString() });
    localStorage.setItem('mgr_contacts', JSON.stringify(contacts));
    return id;
  }

  if (bookingForms.length > 0) {
    bookingForms.forEach(form => {
      form.addEventListener('submit', function (e) {
        e.preventDefault();

        const isContactForm = !!(document.getElementById('contactName') && form.contains(document.getElementById('contactName')));

        let refId;
        if (isContactForm) {
          refId = lsSaveContact({
            name: document.getElementById('contactName') ? document.getElementById('contactName').value : '',
            email: document.getElementById('contactEmail') ? document.getElementById('contactEmail').value : '',
            phone: document.getElementById('contactPhone') ? document.getElementById('contactPhone').value : '',
            device: document.getElementById('contactDevice') ? document.getElementById('contactDevice').value : '',
            message: document.getElementById('contactMsg') ? document.getElementById('contactMsg').value : ''
          });
        } else {
          const servicePref = document.querySelector('input[name="servicePref"]:checked');
          refId = lsSaveBooking({
            firstName: document.getElementById('bookFirstName') ? document.getElementById('bookFirstName').value : '',
            email: document.getElementById('bookEmail') ? document.getElementById('bookEmail').value : '',
            phone: document.getElementById('bookPhone') ? document.getElementById('bookPhone').value : '',
            date: document.getElementById('bookDate') ? document.getElementById('bookDate').value : '',
            device: document.getElementById('bookDevice') ? document.getElementById('bookDevice').value : '',
            servicePref: servicePref ? servicePref.value : 'dropoff',
            message: document.getElementById('bookMessage') ? document.getElementById('bookMessage').value : ''
          });
        }

        if (modalRefNumber) modalRefNumber.textContent = refId;
        if (confirmationModal) {
          confirmationModal.classList.add('active');
          document.body.style.overflow = 'hidden';
        }
        form.reset();
        const charCount = document.getElementById('charCount');
        if (charCount) charCount.textContent = '0 / 180';
      });
    });
  }


  if (modalCloseBtn && confirmationModal) {
    modalCloseBtn.addEventListener('click', function () {
      confirmationModal.classList.remove('active');
      document.body.style.overflow = 'auto';
    });
    confirmationModal.addEventListener('click', function (e) {
      if (e.target === confirmationModal) {
        confirmationModal.classList.remove('active');
        document.body.style.overflow = 'auto';
      }
    });
  }

  // ==========================================
  // 4. TEXTAREA CHARACTER COUNTER
  // ==========================================
  const messageTextarea = document.getElementById('contactMsg') || document.getElementById('bookMessage') || document.getElementById('formMessage');
  const charCount = document.getElementById('charCount');

  if (messageTextarea && charCount) {
    messageTextarea.addEventListener('input', function () {
      let currentLength = messageTextarea.value.length;
      charCount.textContent = `${currentLength} / 180`;
      if (currentLength > 160) {
        charCount.style.color = '#dc2626';
      } else {
        charCount.style.color = 'var(--text-light)';
      }
    });
  }

  // ==========================================
  // 5. FILE UPLOAD DROPZONE LOGIC
  // ==========================================
  const fileDropzone = document.getElementById('fileDropzone');
  const fileInput = document.getElementById('contactDeviceImages') || document.getElementById('bookDeviceImages') || document.getElementById('deviceImages');
  const fileDropzoneText = document.getElementById('fileDropzoneText');

  if (fileDropzone && fileInput) {
    fileDropzone.addEventListener('click', function () {
      fileInput.click();
    });

    fileInput.addEventListener('change', function () {
      if (fileInput.files.length > 0) {
        fileDropzoneText.innerHTML = `<span style="color: var(--primary); font-weight: 700;"><i class="fa-solid fa-circle-check"></i> ${fileInput.files.length} file(s) selected</span>`;
      } else {
        fileDropzoneText.innerHTML = 'Drag and Drop (or) <span>Choose Files</span>';
      }
    });

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      fileDropzone.addEventListener(eventName, function (e) { e.preventDefault(); e.stopPropagation(); }, false);
    });
    ['dragenter', 'dragover'].forEach(eventName => {
      fileDropzone.addEventListener(eventName, function () {
        fileDropzone.style.borderColor = 'var(--primary)';
        fileDropzone.style.backgroundColor = 'rgba(249, 115, 22, 0.05)';
      }, false);
    });
    ['dragleave', 'drop'].forEach(eventName => {
      fileDropzone.addEventListener(eventName, function () {
        fileDropzone.style.borderColor = 'var(--border-color)';
        fileDropzone.style.backgroundColor = 'var(--bg-alt)';
      }, false);
    });
    fileDropzone.addEventListener('drop', function (e) {
      if (e.dataTransfer.files.length > 0) {
        fileInput.files = e.dataTransfer.files;
        fileInput.dispatchEvent(new Event('change'));
      }
    }, false);
  }
});