/**
 * Shared test fixture data that mirrors the seed data structure.
 */

export const FIXTURES = {
  plans: {
    free:   { id: "plan-free",   name: "FREE",   price: 0,   stripePriceId: null },
    basic:  { id: "plan-basic",  name: "BASIC",  price: 799, stripePriceId: null },
    pro:    { id: "plan-pro",    name: "PRO",    price: 1299, stripePriceId: null },
    global: { id: "plan-global", name: "GLOBAL", price: 2499, stripePriceId: null },
  },

  templates: {
    free:    { id: "tmpl-minimal", name: "minimal",   isPremium: false },
    premium: { id: "tmpl-premium", name: "executive",  isPremium: true  },
  },

  users: {
    freeUser: {
      id: "free-user-id",
      email: "free@test.com",
      role: "USER" as const,
      subscription: { plan: { name: "FREE" } },
    },
    basicUser: {
      id: "basic-user-id",
      email: "basic@test.com",
      role: "USER" as const,
      subscription: { plan: { name: "BASIC" } },
    },
    proUser: {
      id: "pro-user-id",
      email: "pro@test.com",
      role: "USER" as const,
      subscription: { plan: { name: "PRO" } },
    },
    globalUser: {
      id: "global-user-id",
      email: "global@test.com",
      role: "USER" as const,
      subscription: { plan: { name: "GLOBAL" } },
    },
    adminUser: {
      id: "admin-id",
      email: "admin@test.com",
      role: "ADMIN" as const,
      subscription: null,
    },
    // USER-role account that gets ADMIN limits via email bypass
    adminEmailUser: {
      id: "admin-email-id",
      email: "mayankgaur.8@gmail.com",
      role: "USER" as const,
      subscription: null,
    },
  },

  resumes: {
    basic: {
      id: "resume-1",
      userId: "free-user-id",
      title: "My Resume",
      languageCode: "en",
      templateId: "tmpl-minimal",
      targetCountry: "US",
      sections: [],
    },
  },

  stripeEvents: {
    checkoutComplete: {
      type: "checkout.session.completed",
      data: {
        object: {
          client_reference_id: "free-user-id",
          subscription: "sub_test123",
          customer: "cus_test123",
        },
      },
    },
    subscriptionDeleted: {
      type: "customer.subscription.deleted",
      data: { object: { id: "sub_test123", status: "canceled", items: { data: [] } } },
    },
    invoiceFailed: {
      type: "invoice.payment_failed",
      data: {
        object: {
          parent: {
            subscription_details: { subscription: "sub_test123" },
          },
        },
      },
    },
  },
}
