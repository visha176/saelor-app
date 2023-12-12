// src/pages/api/webhooks/order-created.ts
import JazzcashService from '../../../lib/jazzcash-service';
import { gql } from 'urql';
import { SaleorAsyncWebhook } from '@saleor/app-sdk/handlers/next';
import { OrderCreatedWebhookPayloadFragment } from '../../../../generated/graphql';
import { saleorApp } from '../../../saleor-app';
import { createClient } from '../../../lib/create-graphq-client';

const OrderCreatedWebhookPayload = gql`
  fragment OrderCreatedWebhookPayload on OrderCreated {
    order {
      userEmail
      id
      number
      user {
        email
        firstName
        lastName
      }
    }
  }
`;

const OrderCreatedGraphqlSubscription = gql`
  ${OrderCreatedWebhookPayload}
  subscription OrderCreated {
    event {
      ...OrderCreatedWebhookPayload
    }
  }
`;

export const orderCreatedWebhook = new SaleorAsyncWebhook<OrderCreatedWebhookPayloadFragment>({
  name: 'Order Created in Saleor',
  webhookPath: 'api/webhooks/order-created',
  event: 'ORDER_CREATED',
  apl: saleorApp.apl,
  query: OrderCreatedGraphqlSubscription,
});

export default orderCreatedWebhook.createHandler(async (req, res, ctx) => {
  const { payload, authData } = ctx;

  console.log(`Order was created for customer: ${payload.order?.userEmail}`);

  try {
    await JazzcashService.handleCallback(req.body);
    res.status(200).send('JazzCash Callback Received');
  } catch (error) {
    console.error('JazzCash callback processing error:', error);
    res.status(500).send('Internal Server Error');
  }

  const client = createClient(authData.saleorApiUrl, async () => ({ token: authData.token }));
  return res.status(200).end();
});

export const config = {
  api: {
    bodyParser: false,
  },
};
