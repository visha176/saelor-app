// src/pages/order-example.tsx
import JazzcashService from 'C:/Users/shiek/Desktop/saleor dashboard/my-easypaisa-app/src/lib/jazzcash-service';
import { actions, useAppBridge } from "@saleor/app-sdk/app-bridge";
import { Box, Text } from "@saleor/macaw-ui";
import gql from "graphql-tag";
import Link from "next/link";
import { useLastOrderQuery } from "../generated/graphql";

interface SaleorOrder {
  id: string;
  // Other order properties...
}

gql`
  query LastOrder {
    orders(first: 1) {
      edges {
        node {
          id
          number
          created
          user {
            firstName
            lastName
          }
          shippingAddress {
            country {
              country
            }
          }
          total {
            gross {
              amount
              currency
            }
          }
          lines {
            id
          }
        }
      }
    }
  }
`;

function generateNumberOfLinesText(lines: any[]) {
  if (lines.length === 0) {
    return "no lines";
  }

  if (lines.length === 1) {
    return "1 line";
  }

  return `${lines.length} lines`;
}

export const OrderExample = () => {
  const { appBridge } = useAppBridge();
  const [{ data, fetching }] = useLastOrderQuery();
  const lastOrder = data?.orders?.edges[0]?.node;

  const navigateToOrder = (id: string) => {
    appBridge?.dispatch(
      actions.Redirect({
        to: `/orders/${id}`,
      })
    );
  };

  const order: SaleorOrder = {
    id: '123', // Sample order ID
    // Other order properties...
  };

  const initiateJazzCashPayment = async () => {
    try {
      await JazzcashService.initiatePayment(order);
      // Redirect or handle the next steps after successful payment initiation
    } catch (error) {
      console.error('JazzCash payment initiation error:', error);
    }
  };

  return (
    <Box display="flex" flexDirection={"column"} gap={2}>
      <Text as={"h2"} variant={"heading"}>
        Fetching data
      </Text>

      <>
        {fetching && <Text color="textNeutralSubdued">Fetching the last order...</Text>}
        {lastOrder && (
          <>
            <Text color="textNeutralSubdued">
              ❗ The <code>orders</code> query requires the <code>MANAGE_ORDERS</code> permission.
              If you want to query other resources, make sure to update the app permissions in the{" "}
              <code>/src/pages/api/manifest.ts</code> file.
            </Text>
            <Box
              backgroundColor={"subdued"}
              padding={4}
              borderRadius={4}
              borderWidth={1}
              borderStyle={"solid"}
              borderColor={"neutralDefault"}
              marginY={4}
            >
              <Text>{`The last order #${lastOrder.number}:`}</Text>
              <ul>
                <li>
                  <Text>{`Contains ${generateNumberOfLinesText(lastOrder.lines)} 🛒`}</Text>
                </li>
                <li>
                  <Text>{`For a total amount of ${lastOrder.total.gross.amount} ${lastOrder.total.gross.currency} 💸`}</Text>
                </li>
                <li>
                  <Text>{`Ships to ${lastOrder.shippingAddress?.country.country} 📦`}</Text>
                </li>
              </ul>
              <button onClick={initiateJazzCashPayment}>Initiate JazzCash Payment</button>
              <Link onClick={() => navigateToOrder(lastOrder.id)} href={`/orders/${lastOrder.id}`}>
                See the order details →
              </Link>
            </Box>
          </>
        )}
        {!fetching && !lastOrder && <Text color="textNeutralSubdued">No orders found</Text>}
      </>
    </Box>
  );
};

