import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'VibeMap',
        short_name: 'VibeMap',
        description: 'Stay connected regarding vibe.',
        start_url: '/',
        display: 'standalone',
        background_color: '#121212',
        theme_color: '#6C63FF',
        icons: [
            {
                src: '/favicon.ico',
                sizes: 'any',
                type: 'image/x-icon',
            },
        ],
    }
}
