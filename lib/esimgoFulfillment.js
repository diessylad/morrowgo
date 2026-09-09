export async function createEsimGoTransaction(
  apiKey,
  bundleName
) {
  const response =
    await fetch(
      'https://api.esim-go.com/v2.5/orders',
      {
        method: 'POST',

        headers: {
          'X-API-Key': apiKey,
          'Content-Type':
            'application/json',
          Accept:
            'application/json'
        },

        body:
          JSON.stringify({
            type: 'transaction',
            assign: true,

            order: [
              {
                type: 'bundle',
                quantity: 1,
                item: bundleName,
                allowReassign: false
              }
            ]
          }),

        cache: 'no-store'
      }
    );

  const data =
    await response
      .json()
      .catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.message ||
      `eSIM Go transaction failed: ${response.status}`
    );
  }

  if (!data?.orderReference) {
    throw new Error(
      'eSIM Go did not return orderReference'
    );
  }

  return data;
}

export async function getEsimInstallDetails(
  apiKey,
  orderReference
) {
  const params =
    new URLSearchParams({
      reference:
        orderReference,

      additionalFields:
        'installUrl'
    });

  const response =
    await fetch(
      `https://api.esim-go.com/v2.5/esims/assignments?${params.toString()}`,
      {
        headers: {
          'X-API-Key':
            apiKey,

          Accept:
            'application/json'
        },

        cache:
          'no-store'
      }
    );

  const data =
    await response
      .json()
      .catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.message ||
      `Could not retrieve eSIM installation details: ${response.status}`
    );
  }

  const assignment =
    Array.isArray(data)
      ? data[0]
      : data;

  if (
    !assignment?.matchingId ||
    !assignment?.smdpAddress
  ) {
    throw new Error(
      'eSIM installation details are incomplete'
    );
  }

  const activationCode =
    `LPA:1$${assignment.smdpAddress}$${assignment.matchingId}`;

  return {
    iccid:
      assignment.iccid ||
      null,

    matchingId:
      assignment.matchingId,

    smdpAddress:
      assignment.smdpAddress,

    profileStatus:
      assignment.profileStatus ||
      null,

    appleInstallUrl:
      assignment.appleInstallUrl ||
      null,

    androidInstallUrl:
      assignment.androidInstallUrl ||
      null,

    activationCode
  };
}
