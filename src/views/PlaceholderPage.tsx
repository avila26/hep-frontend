import React from 'react';

interface PlaceholderPageProps {
    title: string;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title }) => {
    return (
        <div className="p-4">
            <h2>{title}</h2>
            <p>Esta vista estará disponible próximamente.</p>
        </div>
    );
};

export default PlaceholderPage;
