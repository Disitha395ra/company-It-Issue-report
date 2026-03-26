import './Footer.css';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="app-footer">
            <div className="footer-content">
                <p>
                    &copy; {currentYear} IT Support Portal. Developed by{' '}
                    <a
                        href="https://github.com/Disitha395ra"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="profile-link"
                    >
                        Disitha Ranasinghe
                    </a>
                </p>
            </div>
        </footer>
    );
}
