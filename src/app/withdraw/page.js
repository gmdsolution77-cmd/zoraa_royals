import { redirect } from 'next/navigation';

export default function WithdrawRedirectPage() {
  redirect('/cashout');
}
