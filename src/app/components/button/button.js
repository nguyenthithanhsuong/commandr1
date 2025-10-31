"use client";

import PropTypes from 'prop-types';
import './button.css';

const Button = ({ text, onClick, style, width, type = 'button' }) => {
    console.log('Button props:', { text, type }); // Debug log
    let buttonStyle;
    if (style=='Filled') {
    buttonStyle = {
        minWidth: `${Math.max(text.length * 10, 80)}px`, // Dynamic width based on text length
        padding: '8px 16px',
        borderRadius: '4px',
        border: 'none',
        backgroundColor: '#000000ff',
        color: 'white',
        cursor: 'pointer',
        fontSize: '16px',
        transition: 'background-color 0.2s ease'
    };} else {
        buttonStyle = {
        minWidth: `${Math.max(text.length * 10, 80)}px`, // Dynamic width based on text length
        padding: '8px 16px',
        borderRadius: '4px',
        border: 'none',
        backgroundColor: '#ffffffff',
        color: 'black',
        cursor: 'pointer',
        fontSize: '16px',
        transition: 'background-color 0.2s ease'
        };}

    // if caller passed an explicit width (e.g. '50%' or '160px'), use it
    if (width) {
        // prefer explicit width over computed minWidth
        buttonStyle.width = width;
        // remove minWidth so the explicit width is used
        delete buttonStyle.minWidth;
    }

    return (
        <button
            style={buttonStyle}
            onClick={onClick}
            type={type}
            className="dynamic-button"
        >
            {text}
        </button>
    );
};

// prop types and defaults
Button.propTypes = {
    text: PropTypes.string.isRequired,
    onClick: PropTypes.func,
    width: PropTypes.string,
    style: PropTypes.string,
};

Button.defaultProps = {
    text: 'Click me',
    onClick: () => {},
    type: 'button',
};

export { Button };
export default Button;
