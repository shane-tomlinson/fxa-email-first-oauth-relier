<template>
  <div class="FxAForm">
    Enter your email to be notified as the special event approaches.

    <form :action="fxaUrl">
      <input type="hidden" name="client_id" :value="clientId" />
      <input type="hidden" name="scope" :value="scope" />
      <input type="hidden" name="state" :value="state" />
      <input type="hidden" name="flow_id" :value="flowId" />
      <input type="hidden" name="flow_begin_time" :value="flowBeginTime" />
      <input type="hidden" name="action" value="email" />
      <input type="hidden" name="utm_campaign" :value="utmCampaign" />
      <input type="hidden" name="utm_source" :value="utmSource" />

      <label for="name">Email:</label>
      <input type="email" name="email" required />
      <button type="submit">Submit</button>
    </form>
  </div>
</template>

<script>
// I used Vue because I like it, conceptually it's not too different from React.
// All of this could be done using plain old JS too.

// Your page needs to create a form that redirects to the correct FxA page with the correct query params.
// You'll need to:
//   1. Get a state token to pass to FxA. This can be done via an XHR request or before
//      your template is rendered and passed into the template.
//   2. Call FxA's /metrics-flow. /metrics-flow is how we keep track
//      of how long a flow takes from beginning to end. Without it,
//      we are blind until the user redirects to FxA, meaning that without it,
//      we have no idea how many users see this page and never redirect to FxA.
//      The call to /metrics-flow will need to pass the *same* utm_ params that
//      you will use in the form when redirecting to FxA.
//   3. Once you have all of the above values, propagate them to FxA. Using
//      a bog standard HTML form is a pretty easy way to do that.
import { FXA_CONTENT_ROOT } from '../config';

export default {
  name: 'FxAForm',

  created () {
    // Gets the state token, on the backend that state token becomes
    // associated with a session cookie and is used to verify the
    // OAuth flow is legit after the user redirects back from FxA.
    fetch('/oauth/state').then(async (resp) => {
      const { state } = await resp.json();
      this.state = state;
    });

    // calls FxA's /metrics-flow with the same utm_ params as in the
    // above form. This call helps us track the amount of time it
    // takes users to complete the flow, and just as importantly,
    // how many users see this form but never redirect to FxA.
    const metricsFlowUrl = new URL(`${FXA_CONTENT_ROOT}/metrics-flow`);
    metricsFlowUrl.searchParams.append('utm_campaign', 'concert');
    metricsFlowUrl.searchParams.append('utm_source', 'mozilla.org');
    fetch(metricsFlowUrl).then(async (resp) => {
      const { flowBeginTime, flowId } = await resp.json();

      this.flowBeginTime = flowBeginTime;
      this.flowId = flowId;
    });
  },

  data() {
    return {
      clientId: '42c02d0c1e811cd5',
      flowId: '',
      flowBeginTime: '',
      fxaUrl: `${FXA_CONTENT_ROOT}/oauth`,
      scope: 'profile basket',
      state: '',
      utmCampaign: 'concert',
      utmSource: 'mozilla.org'
    };
  }
}
</script>
;