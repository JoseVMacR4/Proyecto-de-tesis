document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const formMessage = document.getElementById('formMessage');

    const clearValidation = (input) => {
        if (!input) return;
        input.classList.remove('is-invalid');
    };

    const showFormError = (message) => {
        if (!formMessage) return;
        formMessage.textContent = message;
        formMessage.classList.remove('d-none');
        formMessage.classList.add('show');

        if (formMessage.hideTimeout) {
            clearTimeout(formMessage.hideTimeout);
        }

        formMessage.hideTimeout = setTimeout(() => {
            formMessage.classList.remove('show');
            formMessage.hideTimeout = setTimeout(() => {
                formMessage.classList.add('d-none');
            }, 250);
        }, 3000);
    };

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            clearValidation(usernameInput);
            clearValidation(passwordInput);

            const usernameEmpty = !usernameInput.value.trim();
            const passwordEmpty = !passwordInput.value.trim();

            if (usernameEmpty || passwordEmpty) {
                e.preventDefault();
                if (usernameEmpty) usernameInput.classList.add('is-invalid');
                if (passwordEmpty) passwordInput.classList.add('is-invalid');

                const message = usernameEmpty && passwordEmpty
                    ? 'Rellene los campos de usuario y contraseña.'
                    : usernameEmpty
                        ? 'El campo de usuario es obligatorio.'
                        : 'El campo de contraseña es obligatorio.';

                showFormError(message);
                return;
            }

            const submitBtn = loginForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.style.opacity = '0.8';
                submitBtn.innerHTML = `
                    <div class="spinner-border spinner-border-sm text-light" role="status">
                        <span class="visually-hidden">Cargando...</span>
                    </div>
                    <span>Procesando...</span>
                `;
            }
        });
    }

    const inputs = [usernameInput, passwordInput];
    inputs.forEach(input => {
        if (input) {
            input.addEventListener('focus', () => {
                input.parentElement.classList.add('input-focused');
                clearValidation(input);
            });
            input.addEventListener('input', () => {
                clearValidation(input);
            });
            input.addEventListener('blur', () => {
                input.parentElement.classList.remove('input-focused');
            });
        }
    });

    // Auto-hide backend messages after 5 seconds
    const backendMessages = document.querySelectorAll('.form-message.show:not(#formMessage)');
    backendMessages.forEach(msg => {
        setTimeout(() => {
            msg.classList.remove('show');
            setTimeout(() => msg.classList.add('d-none'), 250);
        }, 5000);
    });

    // Olvidé mi contraseña
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    const modalForgotPassword = document.getElementById('modalForgotPassword');
    const formForgotPassword = document.getElementById('formForgotPassword');
    const forgotEmailInput = document.getElementById('forgotEmail');
    const forgotEmailError = document.getElementById('forgotEmailError');
    const btnForgotSubmit = formForgotPassword.querySelector('button[type="submit"]');

    if (forgotPasswordLink && modalForgotPassword) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            const modal = new bootstrap.Modal(modalForgotPassword);
            modal.show();
        });
    }

    if (formForgotPassword) {
        formForgotPassword.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = forgotEmailInput.value.trim();
            
            forgotEmailError.classList.add('d-none');
            forgotEmailError.textContent = '';
            
            if (!email) {
                forgotEmailError.textContent = 'El correo electrónico es requerido';
                forgotEmailError.classList.remove('d-none');
                return;
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                forgotEmailError.textContent = 'Ingrese un correo electrónico válido';
                forgotEmailError.classList.remove('d-none');
                return;
            }

            btnForgotSubmit.disabled = true;
            btnForgotSubmit.innerHTML = `
                <span class="btn-text">Enviando...</span>
                <div class="spinner-border spinner-border-sm text-light ms-2" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
            `;

            try {
                const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value;
                
                const response = await fetch('/forgot-password/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrfToken || ''
                    },
                    body: JSON.stringify({ email: email })
                });

                const data = await response.json();

                if (data.success) {
                    const modalInstance = bootstrap.Modal.getInstance(modalForgotPassword);
                    modalInstance.hide();
                    
                    forgotEmailInput.value = '';
                    
                    const successToast = document.createElement('div');
                    successToast.className = 'position-fixed top-0 end-0 p-3';
                    successToast.style.zIndex = '9999';
                    successToast.innerHTML = `
                        <div class="toast show align-items-center text-white bg-success border-0 rounded-3" role="alert">
                            <div class="d-flex">
                                <div class="toast-body">${data.message}</div>
                                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                            </div>
                        </div>
                    `;
                    document.body.appendChild(successToast);
                    
                    setTimeout(() => {
                        successToast.remove();
                    }, 4000);
                } else {
                    forgotEmailError.textContent = data.error || 'Error al procesar la solicitud';
                    forgotEmailError.classList.remove('d-none');
                }
            } catch (error) {
                forgotEmailError.textContent = 'Error de conexión. Intente nuevamente.';
                forgotEmailError.classList.remove('d-none');
            } finally {
                btnForgotSubmit.disabled = false;
                btnForgotSubmit.innerHTML = `<span class="btn-text">Enviar</span>`;
            }
        });
    }

    console.log('Login Interface Initialized');
});
