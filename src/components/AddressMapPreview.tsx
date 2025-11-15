import { useEffect, useState } from 'react';

interface AddressMapPreviewProps {
  address: {
    house_number?: string;
    street?: string;
    village_city?: string;
    district?: string;
    state?: string;
    pin_code?: string;
  };
}

export default function AddressMapPreview({ address }: AddressMapPreviewProps) {
  const [mapUrl, setMapUrl] = useState<string>('');

  useEffect(() => {
    if (address.village_city && address.district && address.state) {
      const query = `${address.house_number || ''} ${address.street || ''} ${address.village_city} ${address.district} ${address.state} ${address.pin_code || ''}`.trim();
      const encodedQuery = encodeURIComponent(query);
      setMapUrl(`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6d-s6Q4Xc3dG9pE&q=${encodedQuery}`);
    }
  }, [address]);

  if (!address.village_city || !address.district || !address.state) {
    return (
      <div className="p-8 bg-gray-100 rounded-lg text-center text-gray-500">
        <p>Enter address details to see map preview</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h4 className="font-semibold text-gray-800">Address Map Preview</h4>
      <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
        <iframe
          width="100%"
          height="300"
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          src={mapUrl || `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6d-s6Q4Xc3dG9pE&q=${encodeURIComponent(`${address.village_city} ${address.district} ${address.state}`)}`}
        ></iframe>
      </div>
      <a
        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${address.house_number || ''} ${address.street || ''} ${address.village_city} ${address.district} ${address.state}`)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-primary-navy hover:underline"
      >
        Open in Google Maps →
      </a>
    </div>
  );
}

