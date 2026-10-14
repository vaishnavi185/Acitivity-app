import Swal from 'sweetalert2';

interface ConfirmActionOptions {
  title: string;
  text: string;
  confirmButtonText: string;
  confirmButtonColor?: string;
}

export async function confirmAction({
  title,
  text,
  confirmButtonText,
  confirmButtonColor = '#ea580c',
}: ConfirmActionOptions): Promise<boolean> {
  const result = await Swal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText: 'Cancel',
    confirmButtonColor,
    cancelButtonColor: '#737373',
    reverseButtons: true,
    focusCancel: true,
  });

  return result.isConfirmed;
}
