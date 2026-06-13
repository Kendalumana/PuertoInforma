import React from 'react';
import '../styles/Index.css';

export const SkeletonCard = () => {
    return (
        <div className="result-card skeleton-card">
            <div className="result-card-img skeleton"></div>
            <div className="result-card-body">
                <div className="result-card-top">
                    <div className="skeleton skeleton-text" style={{ width: '60%' }}></div>
                    <div className="skeleton skeleton-badge" style={{ width: '30%' }}></div>
                </div>
                <div className="skeleton skeleton-text" style={{ width: '100%', marginTop: '8px' }}></div>
                <div className="skeleton skeleton-text" style={{ width: '80%' }}></div>
                <div className="result-footer" style={{ marginTop: '12px' }}>
                    <div className="skeleton skeleton-badge" style={{ width: '40%' }}></div>
                </div>
            </div>
        </div>
    );
};

export const SkeletonList = ({ count = 5 }) => {
    return (
        <>
            {Array(count).fill(0).map((_, i) => (
                <SkeletonCard key={i} />
            ))}
        </>
    );
};
