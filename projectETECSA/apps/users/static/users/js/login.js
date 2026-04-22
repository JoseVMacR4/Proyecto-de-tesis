/**
 * ETECSA - Login Page Logic
 */

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
                    ? 'Rellena los campos de usuario y contraseña.'
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

    console.log('ETECSA Login Interface Initialized');
});
