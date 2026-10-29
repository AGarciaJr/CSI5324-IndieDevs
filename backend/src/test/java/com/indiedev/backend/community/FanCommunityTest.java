package com.indiedev.backend.community;

import com.indiedev.backend.model.*;
import com.indiedev.backend.repository.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest @AutoConfigureMockMvc @Transactional
class FanCommunityTest {
    private static final String ROOT = "/api/fan-community";
    @Autowired MockMvc mvc;
    @Autowired ArtistFollowRepository follows;
    @Autowired ArtistRepository artists;
    @Autowired UserAccountRepository accounts;
    @org.springframework.test.context.bean.override.mockito.MockitoSpyBean FanProfileRepository profiles;
    @Autowired ReportRepository reports;
    @Autowired ReportEvidenceRepository evidence;
    @Autowired PostRepository posts;
    @Autowired UserInteractionRepository interactions;

    private String profile(String name, String bio, boolean visible, boolean interests, boolean following, long version) {
        return """
                {"displayName":"%s","biography":"%s","interests":"Jazz and art","image":"",
                "publicProfile":%s,"showInterests":%s,"showFollowing":%s,"version":%s}
                """.formatted(name, bio, visible, interests, following, version);
    }
    private String report(String type, long id, String reason, String evidenceId) {
        return """
                {"targetType":"%s","targetId":%s,"reason":"%s","details":"Please review this context","evidenceId":%s}
                """.formatted(type, id, reason, evidenceId == null ? "null" : "\"" + evidenceId + "\"");
    }
    @Test void followsAreIdempotentAndUpdateBothViewsAndCounts() throws Exception {
        for (int i=0;i<2;i++) mvc.perform(put(ROOT+"/artists/1/follow").header("X-User-Id",1))
                .andExpect(status().isOk()).andExpect(jsonPath("$.following").value(true)).andExpect(jsonPath("$.followerCount").value(1));
        assertThat(follows.findByFanIdOrderByCreatedAtDesc(1L)).hasSize(1);
        assertThat(interactions.findByFanIdAndArtistId(1L,1L).stream().filter(i -> "FOLLOW".equals(i.getInteractionType()))).hasSize(1);
        mvc.perform(get(ROOT+"/following").header("X-User-Id",1)).andExpect(jsonPath("$[0].name").value("Luna Park"));
        mvc.perform(get(ROOT+"/profile").header("X-User-Id",1)).andExpect(jsonPath("$.supportedArtists[0].artistId").value(1));
        mvc.perform(delete(ROOT+"/artists/1/follow").header("X-User-Id",1)).andExpect(status().isNoContent());
        mvc.perform(get(ROOT+"/artists/1/follow").header("X-User-Id",1)).andExpect(jsonPath("$.followerCount").value(0));
    }
    @Test void unavailableArtistsAndInvalidRolesCannotCreateRelationships() throws Exception {
        mvc.perform(put(ROOT+"/artists/1/follow")).andExpect(status().isUnauthorized());
        mvc.perform(put(ROOT+"/artists/1/follow").header("X-User-Id",2)).andExpect(status().isForbidden());
        Artist artist=artists.findById(1L).orElseThrow(); artist.setSuspended(true); artists.saveAndFlush(artist);
        mvc.perform(put(ROOT+"/artists/1/follow").header("X-User-Id",1)).andExpect(status().isConflict());
        artist.setSuspended(false); artists.saveAndFlush(artist);
        UserAccount owner=accounts.findById(2L).orElseThrow(); owner.setStatus(AccountStatus.BANNED); accounts.saveAndFlush(owner);
        mvc.perform(put(ROOT+"/artists/1/follow").header("X-User-Id",1)).andExpect(status().isConflict());
        mvc.perform(put(ROOT+"/artists/9999/follow").header("X-User-Id",1)).andExpect(status().isNotFound());
        assertThat(follows.count()).isZero();
    }
    @Test void differentFansHaveIndependentFollows() throws Exception {
        mvc.perform(put(ROOT+"/artists/1/follow").header("X-User-Id",1)).andExpect(status().isOk());
        mvc.perform(get(ROOT+"/following").header("X-User-Id",5)).andExpect(jsonPath("$.length()").value(0));
        mvc.perform(put(ROOT+"/artists/1/follow").header("X-User-Id",5)).andExpect(jsonPath("$.followerCount").value(2));
    }
    @Test void profileSavesAreVisibleAndPrivacyIsEnforcedForOtherAccounts() throws Exception {
        mvc.perform(put(ROOT+"/profile").header("X-User-Id",1).contentType(MediaType.APPLICATION_JSON)
                .content(profile("New Fan Name","Love independent art",true,false,false,0))).andExpect(status().isOk());
        mvc.perform(get(ROOT+"/profile").header("X-User-Id",1)).andExpect(jsonPath("$.interests").value("Jazz and art"));
        mvc.perform(get(ROOT+"/profiles/1").header("X-User-Id",5)).andExpect(status().isOk())
                .andExpect(jsonPath("$.displayName").value("New Fan Name")).andExpect(jsonPath("$.interests").doesNotExist())
                .andExpect(jsonPath("$.supportedArtists").doesNotExist());
        mvc.perform(put(ROOT+"/profile").header("X-User-Id",1).contentType(MediaType.APPLICATION_JSON)
                .content(profile("New Fan Name","Love independent art",false,true,true,0))).andExpect(status().isOk());
        mvc.perform(get(ROOT+"/profiles/1").header("X-User-Id",5)).andExpect(status().isNotFound());
        mvc.perform(get(ROOT+"/profiles/1").header("X-User-Id",1)).andExpect(status().isOk());
    }
    @Test void invalidProfileAndContentRulesPreservePreviousValues() throws Exception {
        mvc.perform(put(ROOT+"/profile").header("X-User-Id",1).contentType(MediaType.APPLICATION_JSON)
                .content(profile("Saved Name","Saved bio",true,true,true,0))).andExpect(status().isOk());
        mvc.perform(put(ROOT+"/profile").header("X-User-Id",1).contentType(MediaType.APPLICATION_JSON)
                .content(profile("","Bad change",true,true,true,0))).andExpect(status().isBadRequest()).andExpect(jsonPath("$.errors.displayName").exists());
        mvc.perform(put(ROOT+"/profile").header("X-User-Id",1).contentType(MediaType.APPLICATION_JSON)
                .content(profile("Changed Name","<script>bad</script>",true,true,true,0))).andExpect(status().isBadRequest());
        assertThat(profiles.findById(1L).orElseThrow().getBiography()).isEqualTo("Saved bio");
        assertThat(accounts.findById(1L).orElseThrow().getDisplayName()).isEqualTo("Saved Name");
    }
    @Test void profileRejectsStaleVersionAndMalformedImages() throws Exception {
        mvc.perform(put(ROOT+"/profile").header("X-User-Id",1).contentType(MediaType.APPLICATION_JSON)
                .content(profile("First","",true,true,true,0))).andExpect(status().isOk());
        mvc.perform(put(ROOT+"/profile").header("X-User-Id",1).contentType(MediaType.APPLICATION_JSON)
                .content(profile("Second","",true,true,true,0))).andExpect(status().isOk());
        mvc.perform(put(ROOT+"/profile").header("X-User-Id",1).contentType(MediaType.APPLICATION_JSON)
                .content(profile("Stale","",true,true,true,0))).andExpect(status().isConflict());
        mvc.perform(put(ROOT+"/profile").header("X-User-Id",5).contentType(MediaType.APPLICATION_JSON)
                .content(profile("Image","",true,true,true,0).replace("\"image\":\"\"","\"image\":\"data:image/png;base64,aGVsbG8=\"")))
                .andExpect(status().isBadRequest());
    }
    @Test void reportsEnterExistingAdminQueueWithServerResolvedOwnerAndSnapshot() throws Exception {
        mvc.perform(post(ROOT+"/reports").header("X-User-Id",1).contentType(MediaType.APPLICATION_JSON)
                .content(report("EVENT",2,"Spam",null))).andExpect(status().isCreated())
                .andExpect(jsonPath("$.reportedUserId").value(2)).andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.targetSnapshot").value(org.hamcrest.Matchers.containsString("Austin Acoustic Night")));
        mvc.perform(get("/api/reports").header("X-User-Id",3)).andExpect(jsonPath("$.length()").value(4));
        mvc.perform(get(ROOT+"/reports").header("X-User-Id",5)).andExpect(jsonPath("$.length()").value(1));
        mvc.perform(post(ROOT+"/reports").header("X-User-Id",1).contentType(MediaType.APPLICATION_JSON)
                .content(report("EVENT",2,"Spam again",null))).andExpect(status().isConflict());
        assertThat(reports.count()).isEqualTo(4);
    }
    @Test void missingReasonMissingTargetPrivateContentAndInactiveFansAreRejected() throws Exception {
        mvc.perform(post(ROOT+"/reports").header("X-User-Id",1).contentType(MediaType.APPLICATION_JSON)
                .content(report("EVENT",2," ",null))).andExpect(status().isBadRequest());
        mvc.perform(post(ROOT+"/reports").header("X-User-Id",1).contentType(MediaType.APPLICATION_JSON)
                .content(report("POST",9999,"Spam",null))).andExpect(status().isNotFound());
        mvc.perform(post(ROOT+"/reports").header("X-User-Id",1).contentType(MediaType.APPLICATION_JSON)
                .content(report("EVENT",3,"Spam",null))).andExpect(status().isNotFound());
        mvc.perform(post(ROOT+"/reports").header("X-User-Id",2).contentType(MediaType.APPLICATION_JSON)
                .content(report("EVENT",2,"Spam",null))).andExpect(status().isForbidden());
        UserAccount fan=accounts.findById(1L).orElseThrow(); fan.setStatus(AccountStatus.SUSPENDED); accounts.saveAndFlush(fan);
        mvc.perform(get(ROOT+"/profile").header("X-User-Id",1)).andExpect(status().isForbidden());
        assertThat(reports.count()).isEqualTo(3);
    }
    @Test void capturedEvidenceAllowsRemovedOrDeletedContentButCannotBeForgedOrReusedByAnotherFan() throws Exception {
        mvc.perform(post(ROOT+"/report-evidence").header("X-User-Id",5).contentType(MediaType.APPLICATION_JSON)
                .content("{\"targetType\":\"POST\",\"targetId\":1000}")).andExpect(status().isCreated());
        ReportEvidence saved=evidence.findAll().getFirst();
        posts.deleteById(1000L); posts.flush();
        mvc.perform(post(ROOT+"/reports").header("X-User-Id",5).contentType(MediaType.APPLICATION_JSON)
                .content(report("POST",1000,"Spam",null))).andExpect(status().isNotFound());
        mvc.perform(post(ROOT+"/reports").header("X-User-Id",1).contentType(MediaType.APPLICATION_JSON)
                .content(report("EVENT",2,"Spam",saved.getId()))).andExpect(status().isNotFound());
        mvc.perform(post(ROOT+"/reports").header("X-User-Id",5).contentType(MediaType.APPLICATION_JSON)
                .content(report("POST",1000,"Spam",saved.getId()))).andExpect(status().isCreated())
                .andExpect(jsonPath("$.targetSnapshot").value(org.hamcrest.Matchers.containsString("New single out Friday")));
    }
    @Test void reportPickerExcludesDraftsAndPrivateProfiles() throws Exception {
        mvc.perform(put(ROOT+"/profile").header("X-User-Id",5).contentType(MediaType.APPLICATION_JSON)
                .content(profile("Private fan","",false,true,true,0))).andExpect(status().isOk());
        mvc.perform(get(ROOT+"/profiles").header("X-User-Id",1)).andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.userId == 5)]").isEmpty());
        mvc.perform(get(ROOT+"/report-targets").header("X-User-Id",1)).andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.type == 'EVENT' && @.id == 3)]").isEmpty())
                .andExpect(jsonPath("$[?(@.type == 'USER' && @.id == 5)]").isEmpty());
    }

    @Test
    @org.springframework.transaction.annotation.Transactional(propagation = org.springframework.transaction.annotation.Propagation.NOT_SUPPORTED)
    void storageFailureRollsBackBothProfileAndAccountChanges() throws Exception {
        String originalName = accounts.findById(1L).orElseThrow().getDisplayName();
        try {
            mvc.perform(put(ROOT+"/profile").header("X-User-Id",1).contentType(MediaType.APPLICATION_JSON)
                    .content(profile("Persisted Name","Persisted biography",true,true,true,0))).andExpect(status().isOk());
            org.mockito.Mockito.doThrow(new org.springframework.dao.DataAccessResourceFailureException("simulated database write failure"))
                    .when(profiles).saveAndFlush(org.mockito.ArgumentMatchers.any(FanProfile.class));
            mvc.perform(put(ROOT+"/profile").header("X-User-Id",1).contentType(MediaType.APPLICATION_JSON)
                    .content(profile("Must roll back","Must not persist",true,true,true,0))).andExpect(status().isServiceUnavailable());
            assertThat(profiles.findById(1L).orElseThrow().getBiography()).isEqualTo("Persisted biography");
            assertThat(accounts.findById(1L).orElseThrow().getDisplayName()).isEqualTo("Persisted Name");
        } finally {
            org.mockito.Mockito.reset(profiles);
            profiles.deleteById(1L);
            UserAccount account = accounts.findById(1L).orElseThrow(); account.setDisplayName(originalName); accounts.save(account);
        }
    }

    @Test
    @org.springframework.transaction.annotation.Transactional(propagation = org.springframework.transaction.annotation.Propagation.NOT_SUPPORTED)
    void concurrentFollowsAndReportsDoNotCreateDuplicates() throws Exception {
        try (var pool = java.util.concurrent.Executors.newFixedThreadPool(4)) {
            var tasks = new java.util.ArrayList<java.util.concurrent.Callable<Integer>>();
            for (int i=0;i<4;i++) tasks.add(() -> mvc.perform(put(ROOT+"/artists/6/follow").header("X-User-Id",5))
                    .andReturn().getResponse().getStatus());
            for (var result : pool.invokeAll(tasks)) assertThat(result.get()).isEqualTo(200);
            assertThat(follows.findByFanIdOrderByCreatedAtDesc(5L)).hasSize(1);
            assertThat(interactions.findByFanIdAndArtistId(5L,6L)).hasSize(1);
            tasks.clear();
            for (int i=0;i<4;i++) tasks.add(() -> mvc.perform(post(ROOT+"/reports").header("X-User-Id",5)
                    .contentType(MediaType.APPLICATION_JSON).content(report("EVENT",2,"Spam",null)))
                    .andReturn().getResponse().getStatus());
            var statuses = new java.util.ArrayList<Integer>();
            for (var result : pool.invokeAll(tasks)) statuses.add(result.get());
            assertThat(statuses).containsExactlyInAnyOrder(201,409,409,409);
        } finally {
            mvc.perform(delete(ROOT+"/artists/6/follow").header("X-User-Id",5)).andExpect(status().isNoContent());
            reports.deleteAll(reports.findByReporterIdOrderByCreatedAtDesc(5L).stream()
                    .filter(r -> r.getTargetType()==ReportTargetType.EVENT && r.getTargetId().equals(2L)).toList());
        }
    }

    @Test void validUploadedImageAndPublicInterestsArePersisted() throws Exception {
        var image = new java.awt.image.BufferedImage(2,2,java.awt.image.BufferedImage.TYPE_INT_RGB);
        var bytes = new java.io.ByteArrayOutputStream();
        javax.imageio.ImageIO.write(image,"png",bytes);
        String data = "data:image/png;base64,"+java.util.Base64.getEncoder().encodeToString(bytes.toByteArray());
        mvc.perform(put(ROOT+"/profile").header("X-User-Id",1).contentType(MediaType.APPLICATION_JSON)
                .content(profile("Image fan","Loves illustration",true,true,true,0).replace("\"image\":\"\"", "\"image\":\""+data+"\"")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.image").value(data));
        mvc.perform(get(ROOT+"/profiles/1").header("X-User-Id",5)).andExpect(status().isOk())
                .andExpect(jsonPath("$.interests").value("Jazz and art")).andExpect(jsonPath("$.image").value(data));
    }
}
