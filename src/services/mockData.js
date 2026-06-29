export const mockTickets = [
  {
    id: "4c3943b4-e4b0-43be-afd2-4b6bbbb7cc2f", // Matches the exact UUID you tested in Postman
    title: "Inquiry Regarding Server SSH Key Failure",
    status: "Open",
    customerName: "Ankur",
    updatedAt: "Just Now"
  },
  {
    id: "9f8e7d6c-5b4a-3f2e-1d0c-9b8a7f6e5d4c",
    title: "Billing Issue: Requesting 14-Day Refund",
    status: "Pending",
    customerName: "John Doe",
    updatedAt: "25 mins ago"
  }
];

export const mockInitialMessages = {
  "4c3943b4-e4b0-43be-afd2-4b6bbbb7cc2f": [
    {
      id: "m1",
      body: "Hello, I am having trouble logging into the production cluster using my hardware keys.",
      senderType: "CUSTOMER",
      createdAt: new Date(Date.now() - 600000).toISOString()
    }
  ]
};