import React, { useState } from 'react';

const LazyImage = ({ src, alt, className }) => {
    const [isLoaded, setIsLoaded] = useState(false);

    return (
        <div className={`${className} lazy-image-container`}>
            <img 
                src={src} 
                alt={alt} 
                className={`lazy-image ${isLoaded ? 'loaded' : ''}`} 
                onLoad={() => setIsLoaded(true)}
                loading="lazy"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
        </div>
    );
};

export default LazyImage;
