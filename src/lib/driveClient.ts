import { google } from 'googleapis';

export const getDriveClient = () => {
    const auth = new google.auth.GoogleAuth({
        // Your service account key file or credentials here
        keyFile: 'path/to/credentials.json',
        scopes: ['https://www.googleapis.com/auth/drive']
    });

    return google.drive({ version: 'v3', auth });
};
