export {};

declare global {
  interface Window {
<<<<<<< HEAD
    paypal: {
      Buttons: (options: any) => {
        render: (selector: string) => void;
      };
    };
=======
    paypal: any;
>>>>>>> 72767c5b21cf75f8e785e763ce4b4aa9d1a33de7
  }
}
