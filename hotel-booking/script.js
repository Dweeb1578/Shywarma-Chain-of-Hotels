// Navbar scroll effect
const navbar = document.querySelector('.navbar');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 100) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }

    lastScroll = currentScroll;
});

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Animate stats on scroll
const observerOptions = {
    threshold: 0.5,
    rootMargin: '0px'
};

const animateNumbers = (entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const statNumbers = entry.target.querySelectorAll('.stat-number');
            statNumbers.forEach(stat => {
                const finalValue = stat.textContent;
                const numericValue = parseInt(finalValue.replace(/[^0-9]/g, ''));
                const suffix = finalValue.replace(/[0-9]/g, '');
                let current = 0;
                const increment = numericValue / 50;
                const timer = setInterval(() => {
                    current += increment;
                    if (current >= numericValue) {
                        stat.textContent = finalValue;
                        clearInterval(timer);
                    } else {
                        stat.textContent = Math.floor(current) + suffix;
                    }
                }, 30);
            });
        }
    });
};

const statsObserver = new IntersectionObserver(animateNumbers, observerOptions);
const statsSection = document.querySelector('.stats-section');
if (statsSection) {
    statsObserver.observe(statsSection);
}

// Animate cards on scroll
const fadeInOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const fadeInOnScroll = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, fadeInOptions);

document.querySelectorAll('.destination-card, .room-card, .experience-card, .testimonial-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    fadeInOnScroll.observe(card);
});

// Favorite button toggle
document.querySelectorAll('.room-favorite').forEach(btn => {
    btn.addEventListener('click', function () {
        this.classList.toggle('active');
        const svg = this.querySelector('svg');
        if (this.classList.contains('active')) {
            svg.setAttribute('fill', 'currentColor');
            svg.style.color = '#C5A059';
        } else {
            svg.setAttribute('fill', 'none');
            svg.style.color = '';
        }
    });
});

// Newsletter form
const newsletterForm = document.querySelector('.newsletter-form');
if (newsletterForm) {
    newsletterForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const input = this.querySelector('input');
        const email = input.value;
        if (email) {
            alert('Thank you for subscribing! We\'ll send updates to ' + email);
            input.value = '';
        }
    });
}

// Booking widget date inputs
document.querySelectorAll('.booking-field input').forEach(input => {
    input.addEventListener('focus', function () {
        this.closest('.booking-field').style.background = 'rgba(197, 160, 89, 0.08)';
        this.closest('.booking-field').style.borderRadius = '8px';
    });
    input.addEventListener('blur', function () {
        this.closest('.booking-field').style.background = '';
    });
});

// Search button animation
const bookingBtn = document.querySelector('.booking-btn');
if (bookingBtn) {
    bookingBtn.addEventListener('click', function () {
        this.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>Searching...';
        setTimeout(() => {
            this.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>Search';
            alert('This is a demo. In a real implementation, search results would appear here.');
        }, 1500);
    });
}

// Mobile menu toggle
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', function () {
        this.classList.toggle('active');
    });
}

console.log('Shywarma Hotels - Website loaded successfully');
