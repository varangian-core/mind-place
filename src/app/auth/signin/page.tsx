import { getProviders, signIn } from 'next-auth/react';
import { Button, Stack, Typography } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';

export default async function SignInPage() {
  const providers = await getProviders();
  
  return (
    <Stack 
      spacing={2} 
      sx={{ 
        maxWidth: 400, 
        mx: 'auto', 
        mt: 8,
        p: 4,
        border: '1px solid #ccc',
        borderRadius: 2
      }}
    >
      <Typography variant="h5" textAlign="center">
        Sign In with Google
      </Typography>
      {providers && Object.values(providers).map((provider) => (
        <Button
          key={provider.id}
          variant="contained"
          startIcon={<GoogleIcon />}
          onClick={() => signIn(provider.id, { callbackUrl: '/' })}
          fullWidth
          sx={{ py: 1.5 }}
        >
          Continue with Google
        </Button>
      ))}
    </Stack>
  );
}
