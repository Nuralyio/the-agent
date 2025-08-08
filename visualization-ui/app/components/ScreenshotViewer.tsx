import { Button, Caption1, Card, CardBody, CardHeader, Spinner, Title3 } from '@fluentui/react-components';
import { ArrowClockwise24Regular, Camera24Regular, ZoomIn24Regular, ZoomOut24Regular } from '@fluentui/react-icons';
import { useEffect, useState } from 'react';

interface ScreenshotViewerProps {
  screenshot?: string | null;
  loading?: boolean;
  title?: string;
}

export function ScreenshotViewer({ screenshot, loading = false, title }: ScreenshotViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    setImageLoaded(false);
  }, [screenshot]);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.25));
  };

  const handleResetZoom = () => {
    setZoom(1);
  };

  return (
    <Card style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <Title3>
              <Camera24Regular style={{ marginRight: '8px' }} />
              Screenshot
            </Title3>
            {title && <Caption1>{title}</Caption1>}
          </div>

          {screenshot && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button
                size='small'
                appearance='subtle'
                icon={<ZoomOut24Regular />}
                onClick={handleZoomOut}
                disabled={zoom <= 0.25}
              />
              <Button size='small' appearance='subtle' onClick={handleResetZoom}>
                {Math.round(zoom * 100)}%
              </Button>
              <Button
                size='small'
                appearance='subtle'
                icon={<ZoomIn24Regular />}
                onClick={handleZoomIn}
                disabled={zoom >= 3}
              />
              <Button size='small' appearance='subtle' icon={<ArrowClockwise24Regular />} onClick={handleResetZoom} />
            </div>
          )}
        </div>
      </CardHeader>

      <CardBody style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <Spinner size='large' />
            <Caption1>Taking screenshot...</Caption1>
          </div>
        ) : screenshot ? (
          <div
            style={{
              width: '100%',
              height: '100%',
              overflow: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #e1e1e1',
              borderRadius: '8px',
              backgroundColor: '#f8f9fa',
            }}
          >
            <img
              src={`data:image/png;base64,${screenshot}`}
              alt='Browser screenshot'
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                transform: `scale(${zoom})`,
                transition: 'transform 0.2s ease',
                borderRadius: '4px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                display: imageLoaded ? 'block' : 'none',
              }}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageLoaded(false)}
            />
            {!imageLoaded && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <Spinner size='large' />
                <Caption1>Loading screenshot...</Caption1>
              </div>
            )}
          </div>
        ) : (
          <div
            style={{
              textAlign: 'center',
              padding: '40px',
              color: '#605e5c',
              border: '2px dashed #e1e1e1',
              borderRadius: '8px',
              width: '100%',
              maxWidth: '400px',
            }}
          >
            <Camera24Regular style={{ fontSize: '48px', marginBottom: '16px', color: '#c8c6c4' }} />
            <div style={{ fontSize: '16px', marginBottom: '8px' }}>No screenshot available</div>
            <Caption1>Screenshots will appear here during automation execution</Caption1>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
