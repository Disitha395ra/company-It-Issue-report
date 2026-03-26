import './LoadingSpinner.css';

export default function LoadingSpinner({ text = 'Loading...', fullscreen = false, small = false }) {
    return (
        <div className={`spinner-overlay ${fullscreen ? 'fullscreen' : ''}`}>
            <div className={`spinner ${small ? 'small' : ''}`}></div>
            {text && !small && <p className="spinner-text">{text}</p>}
        </div>
    );
}
