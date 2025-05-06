import localFont from 'next/font/local';

export const gellix = localFont({
    src: [
        {
            path: './Gellix-Thin.ttf',
            weight: '100',
            style: 'normal',
        },
        {
            path: './Gellix-Light.ttf',
            weight: '300',
            style: 'normal',
        },
        {
            path: './Gellix-Regular.ttf',
            weight: '400',
            style: 'normal',
        },
        {
            path: './Gellix-Medium.ttf',
            weight: '500',
            style: 'normal',
        },
        {
            path: './Gellix-SemiBold.ttf',
            weight: '600',
            style: 'normal',
        },
        {
            path: './Gellix-Bold.ttf',
            weight: '700',
            style: 'normal',
        },
        {
            path: './Gellix-ExtraBold.ttf',
            weight: '800',
            style: 'normal',
        },
        {
            path: './Gellix-Black.ttf',
            weight: '900',
            style: 'normal',
        },
    ],
    variable: '--font-gellix',
}); 